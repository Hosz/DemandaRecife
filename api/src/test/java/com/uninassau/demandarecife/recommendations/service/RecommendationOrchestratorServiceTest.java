package com.uninassau.demandarecife.recommendations.service;

import com.uninassau.demandarecife.recommendations.dto.AiRecommendationDto;
import com.uninassau.demandarecife.recommendations.dto.MerchantDailyContext;
import com.uninassau.demandarecife.recommendations.entity.AiRecommendation;
import com.uninassau.demandarecife.recommendations.enums.RecommendationCategory;
import com.uninassau.demandarecife.recommendations.enums.RecommendationOrigin;
import com.uninassau.demandarecife.recommendations.enums.RecommendationStatus;
import com.uninassau.demandarecife.recommendations.repository.AiRecommendationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecommendationOrchestratorServiceTest {

    @Mock
    private AiRecommendationRepository repository;

    @Mock
    private AiContextBuilder contextBuilder;

    @Mock
    private GeminiRecommendationService geminiService;

    @InjectMocks
    private RecommendationOrchestratorService orchestrator;

    private UUID tenantId;
    private LocalDate hoje;
    private MerchantDailyContext ctx;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        hoje = LocalDate.now();

        ctx = new MerchantDailyContext(
                tenantId,
                hoje,
                "SEG",
                "Cafeteria",
                "Recife, PE",
                "Derby",
                "08:00 às 18:00",
                new BigDecimal("25.00"),
                "Ensolarado",
                "28°C",
                List.of(),
                List.of(),
                "16:00",
                "entre 15h e 17h",
                List.of(),
                0,
                true
        );
    }

    @Test
    @DisplayName("Primeiro acesso do dia: deve construir contexto, chamar IA e persistir todas as áreas no banco")
    void deveGerarEPersistirNoPrimeiroAcesso() {
        when(repository.findAllByTenantIdAndDataReferenciaOrderByCategoriaAsc(tenantId, hoje))
                .thenReturn(List.of())
                .thenReturn(List.of());
        when(contextBuilder.buildContext(tenantId, hoje)).thenReturn(ctx);

        AiRecommendation recEstoque = new AiRecommendation();
        recEstoque.setId(UUID.randomUUID());
        recEstoque.setTenantId(tenantId);
        recEstoque.setDataReferencia(hoje);
        recEstoque.setCategoria(RecommendationCategory.ESTOQUE);
        recEstoque.setTitulo("Comprar Café Especial");
        recEstoque.setOrigem(RecommendationOrigin.IA_GEMINI);

        AiRecommendation recEquipe = new AiRecommendation();
        recEquipe.setId(UUID.randomUUID());
        recEquipe.setTenantId(tenantId);
        recEquipe.setDataReferencia(hoje);
        recEquipe.setCategoria(RecommendationCategory.EQUIPE);
        recEquipe.setTitulo("Reforço 16h");
        recEquipe.setOrigem(RecommendationOrigin.IA_GEMINI);

        when(geminiService.generateRecommendations(ctx)).thenReturn(List.of(recEstoque, recEquipe));
        when(repository.saveAndFlush(any(AiRecommendation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<AiRecommendationDto> dtos = orchestrator.getDailyRecommendations(tenantId, hoje);

        assertThat(dtos).hasSize(2);
        assertThat(dtos.get(0).titulo()).isEqualTo("Comprar Café Especial");
        assertThat(dtos.get(1).titulo()).isEqualTo("Reforço 16h");
        verify(repository, times(2)).saveAndFlush(any(AiRecommendation.class));
    }

    @Test
    @DisplayName("Acessos subsequentes no mesmo dia: deve retornar do banco sem chamar IA")
    void deveRecuperarDoCacheQuandoJaExistir() {
        AiRecommendation salva = new AiRecommendation();
        salva.setId(UUID.randomUUID());
        salva.setTenantId(tenantId);
        salva.setDataReferencia(hoje);
        salva.setCategoria(RecommendationCategory.PROMOCAO);
        salva.setTitulo("Recomendação em Cache");
        salva.setStatus(RecommendationStatus.PENDENTE);

        when(repository.findAllByTenantIdAndDataReferenciaOrderByCategoriaAsc(tenantId, hoje))
                .thenReturn(List.of(salva));

        List<AiRecommendationDto> dtos = orchestrator.getDailyRecommendations(tenantId, hoje);

        assertThat(dtos).hasSize(1);
        assertThat(dtos.get(0).titulo()).isEqualTo("Recomendação em Cache");
        verifyNoInteractions(contextBuilder);
        verifyNoInteractions(geminiService);
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Quando outra thread salva antes do lock ser adquirido, double-check deve recuperar sem chamar IA")
    void deveRecuperarExistenteNoDoubleCheckSemChamarIA() {
        AiRecommendation recConcorrente = new AiRecommendation();
        recConcorrente.setId(UUID.randomUUID());
        recConcorrente.setTenantId(tenantId);
        recConcorrente.setDataReferencia(hoje);
        recConcorrente.setTitulo("Recomendação do Double-Check");
        recConcorrente.setCategoria(RecommendationCategory.ESTOQUE);

        when(repository.findAllByTenantIdAndDataReferenciaOrderByCategoriaAsc(tenantId, hoje))
                .thenReturn(List.of())
                .thenReturn(List.of(recConcorrente));

        List<AiRecommendationDto> dtos = orchestrator.getDailyRecommendations(tenantId, hoje);

        assertThat(dtos).hasSize(1);
        assertThat(dtos.get(0).titulo()).isEqualTo("Recomendação do Double-Check");
        verifyNoInteractions(contextBuilder);
        verifyNoInteractions(geminiService);
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Regenerate deve atualizar recomendações de hoje com nova saída da IA para cada área")
    void deveRegenerarAtualizandoRecomendacoes() {
        AiRecommendation existente = new AiRecommendation();
        existente.setId(UUID.randomUUID());
        existente.setTenantId(tenantId);
        existente.setDataReferencia(hoje);
        existente.setCategoria(RecommendationCategory.ESTOQUE);
        existente.setTitulo("Recomendação Antiga");
        existente.setStatus(RecommendationStatus.APLICADO);

        when(contextBuilder.buildContext(tenantId, hoje)).thenReturn(ctx);

        AiRecommendation nova = new AiRecommendation();
        nova.setCategoria(RecommendationCategory.ESTOQUE);
        nova.setTitulo("Recomendação Nova Atualizada");
        nova.setDiagnostico("Novo diagnóstico");
        nova.setAcaoSugerida("Nova ação");
        nova.setImpactoEstimado("Novo impacto");
        nova.setOrigem(RecommendationOrigin.IA_GEMINI);

        when(geminiService.generateRecommendations(ctx)).thenReturn(List.of(nova));
        when(repository.findByTenantIdAndDataReferenciaAndCategoria(tenantId, hoje, RecommendationCategory.ESTOQUE))
                .thenReturn(Optional.of(existente));
        when(repository.saveAndFlush(any(AiRecommendation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<AiRecommendationDto> resultado = orchestrator.regenerateDailyRecommendations(tenantId, hoje);

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).titulo()).isEqualTo("Recomendação Nova Atualizada");
        assertThat(resultado.get(0).status()).isEqualTo(RecommendationStatus.PENDENTE);
        assertThat(existente.getTitulo()).isEqualTo("Recomendação Nova Atualizada");
        assertThat(existente.getAplicadoEm()).isNull();
    }

    @Test
    @DisplayName("Deve marcar recomendação como APLICADA")
    void deveMarcarComoAplicada() {
        UUID recId = UUID.randomUUID();
        AiRecommendation rec = new AiRecommendation();
        rec.setId(recId);
        rec.setTenantId(tenantId);
        rec.setStatus(RecommendationStatus.PENDENTE);

        when(repository.findByIdAndTenantId(recId, tenantId)).thenReturn(Optional.of(rec));
        when(repository.save(any(AiRecommendation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AiRecommendationDto resultado = orchestrator.applyRecommendation(tenantId, recId);

        assertThat(resultado.status()).isEqualTo(RecommendationStatus.APLICADO);
        assertThat(rec.getAplicadoEm()).isNotNull();
    }

    @Test
    @DisplayName("Deve marcar recomendação como DISPENSADA")
    void deveMarcarComoDispensada() {
        UUID recId = UUID.randomUUID();
        AiRecommendation rec = new AiRecommendation();
        rec.setId(recId);
        rec.setTenantId(tenantId);
        rec.setStatus(RecommendationStatus.PENDENTE);

        when(repository.findByIdAndTenantId(recId, tenantId)).thenReturn(Optional.of(rec));
        when(repository.save(any(AiRecommendation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AiRecommendationDto resultado = orchestrator.dismissRecommendation(tenantId, recId);

        assertThat(resultado.status()).isEqualTo(RecommendationStatus.DISPENSADO);
    }
}
