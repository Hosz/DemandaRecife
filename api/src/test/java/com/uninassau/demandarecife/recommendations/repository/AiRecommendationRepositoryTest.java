package com.uninassau.demandarecife.recommendations.repository;

import com.uninassau.demandarecife.recommendations.entity.AiRecommendation;
import com.uninassau.demandarecife.recommendations.enums.RecommendationCategory;
import com.uninassau.demandarecife.recommendations.enums.RecommendationOrigin;
import com.uninassau.demandarecife.recommendations.enums.RecommendationStatus;
import com.uninassau.demandarecife.tenants.entity.Tenant;
import com.uninassau.demandarecife.tenants.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
class AiRecommendationRepositoryTest {

    @Autowired
    private AiRecommendationRepository repository;

    @Autowired
    private TenantRepository tenantRepository;

    private Tenant tenant;

    @BeforeEach
    void setUp() {
        tenant = new Tenant();
        tenant.setNome("Padaria Boa Viagem");
        tenant.setCidade("Recife");
        tenant.setEstado("PE");
        tenant = tenantRepository.save(tenant);
    }

    @Test
    @DisplayName("Deve persistir recomendações de diferentes áreas para o mesmo dia e recuperar a lista completa")
    void devePersistirMultiplasAreasNoMesmoDia() {
        LocalDate hoje = LocalDate.now();

        AiRecommendation recEstoque = new AiRecommendation();
        recEstoque.setTenantId(tenant.getId());
        recEstoque.setDataReferencia(hoje);
        recEstoque.setCategoria(RecommendationCategory.ESTOQUE);
        recEstoque.setTitulo("Comprar Farinha");
        recEstoque.setDiagnostico("Estoque crítico");
        recEstoque.setAcaoSugerida("Comprar 20kg");
        recEstoque.setOrigem(RecommendationOrigin.IA_GEMINI);
        recEstoque.setStatus(RecommendationStatus.PENDENTE);
        recEstoque.setPayloadAcao(Map.of("tipoAcao", "COMPRA_ESTOQUE"));
        repository.saveAndFlush(recEstoque);

        AiRecommendation recEquipe = new AiRecommendation();
        recEquipe.setTenantId(tenant.getId());
        recEquipe.setDataReferencia(hoje);
        recEquipe.setCategoria(RecommendationCategory.EQUIPE);
        recEquipe.setTitulo("Reforço no Fechamento");
        recEquipe.setDiagnostico("Pico às 18h");
        recEquipe.setAcaoSugerida("Adicionar 1 colaborador");
        recEquipe.setOrigem(RecommendationOrigin.IA_GEMINI);
        recEquipe.setStatus(RecommendationStatus.PENDENTE);
        recEquipe.setPayloadAcao(Map.of("tipoAcao", "REFORCO_TURNO"));
        repository.saveAndFlush(recEquipe);

        List<AiRecommendation> todas = repository.findAllByTenantIdAndDataReferenciaOrderByCategoriaAsc(tenant.getId(), hoje);
        assertThat(todas).hasSize(2);

        Optional<AiRecommendation> buscaEstoque = repository.findByTenantIdAndDataReferenciaAndCategoria(tenant.getId(), hoje, RecommendationCategory.ESTOQUE);
        assertThat(buscaEstoque).isPresent();
        assertThat(buscaEstoque.get().getTitulo()).isEqualTo("Comprar Farinha");
    }

    @Test
    @DisplayName("Deve impedir duplicidade para a MESMA categoria no mesmo dia (Unique Constraint por Categoria)")
    void deveImpedirDuplicidadeMesmaCategoria() {
        LocalDate hoje = LocalDate.now();

        AiRecommendation rec1 = new AiRecommendation();
        rec1.setTenantId(tenant.getId());
        rec1.setDataReferencia(hoje);
        rec1.setCategoria(RecommendationCategory.ESTOQUE);
        rec1.setTitulo("Comprar Farinha");
        rec1.setDiagnostico("Estoque crítico");
        rec1.setAcaoSugerida("Comprar 20kg");
        rec1.setOrigem(RecommendationOrigin.HEURISTICA_FALLBACK);
        rec1.setStatus(RecommendationStatus.PENDENTE);
        repository.saveAndFlush(rec1);

        AiRecommendation rec2 = new AiRecommendation();
        rec2.setTenantId(tenant.getId());
        rec2.setDataReferencia(hoje);
        rec2.setCategoria(RecommendationCategory.ESTOQUE); // mesma categoria
        rec2.setTitulo("Comprar Óleo");
        rec2.setDiagnostico("Ruptura");
        rec2.setAcaoSugerida("Comprar 10L");
        rec2.setOrigem(RecommendationOrigin.IA_GEMINI);
        rec2.setStatus(RecommendationStatus.PENDENTE);

        assertThrows(DataIntegrityViolationException.class, () -> repository.saveAndFlush(rec2));
    }
}
