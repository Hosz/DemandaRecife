package com.uninassau.demandarecife.recommendations.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uninassau.demandarecife.recommendations.dto.MerchantDailyContext;
import com.uninassau.demandarecife.recommendations.entity.AiRecommendation;
import com.uninassau.demandarecife.recommendations.enums.RecommendationCategory;
import com.uninassau.demandarecife.recommendations.enums.RecommendationOrigin;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GeminiRecommendationServiceTest {

    @Mock
    private ObjectProvider<ChatModel> chatModelProvider;

    @Mock
    private HeuristicRecommendationService heuristicFallback;

    private ObjectMapper objectMapper;
    private GeminiRecommendationService service;
    private MerchantDailyContext ctx;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new GeminiRecommendationService(chatModelProvider, heuristicFallback, objectMapper);

        ctx = new MerchantDailyContext(
                UUID.randomUUID(),
                LocalDate.now(),
                "SEG",
                "Hamburgueria",
                "Recife, PE",
                "Boa Viagem",
                "18:00 às 23:00",
                new BigDecimal("45.00"),
                "Ensolarado",
                "28°C",
                List.of(),
                List.of(),
                "20:00",
                "entre 19h e 21h",
                List.of(),
                0,
                true
        );
    }

    @Test
    @DisplayName("Quando a API Key for dummy ou vazia, deve delegar imediatamente para o fallback heurístico generateAll")
    void deveDelegarParaFallbackQuandoApiKeyDummy() {
        // Força o modo fallback heurístico sem depender de leitura de arquivo .env no ambiente de teste
        ReflectionTestUtils.setField(service, "forceHeuristicFallback", true);

        AiRecommendation rec1 = new AiRecommendation();
        rec1.setCategoria(RecommendationCategory.ESTOQUE);
        rec1.setTitulo("Fallback Estoque");
        rec1.setOrigem(RecommendationOrigin.HEURISTICA_FALLBACK);

        AiRecommendation rec2 = new AiRecommendation();
        rec2.setCategoria(RecommendationCategory.EQUIPE);
        rec2.setTitulo("Fallback Equipe");
        rec2.setOrigem(RecommendationOrigin.HEURISTICA_FALLBACK);

        when(heuristicFallback.generateAll(ctx)).thenReturn(List.of(rec1, rec2));

        List<AiRecommendation> resultado = service.generateRecommendations(ctx);

        assertThat(resultado).hasSize(2);
        assertThat(resultado.get(0).getOrigem()).isEqualTo(RecommendationOrigin.HEURISTICA_FALLBACK);
        verify(heuristicFallback).generateAll(ctx);
    }

    @Test
    @DisplayName("parseMultiResponse deve interpretar JSON com array de recomendações e mapear categorias")
    void deveFazerParseMultiploComSucesso() throws Exception {
        String jsonGemini = """
            {
              "recomendacoes": [
                {
                  "categoria": "ESTOQUE",
                  "titulo": "Pedido emergencial de insumos",
                  "diagnostico": "Estoque zerado",
                  "acaoSugerida": "Comprar 50 unidades",
                  "impactoEstimado": "Evita rupturas",
                  "tipoAcao": "COMPRA_ESTOQUE",
                  "detalhesAcao": {"quantidade": 50}
                },
                {
                  "categoria": "EQUIPE",
                  "titulo": "Reforço no turno da noite",
                  "diagnostico": "Pico às 20h",
                  "acaoSugerida": "Adicionar 1 atendente",
                  "impactoEstimado": "-20% filas",
                  "tipoAcao": "REFORCO_TURNO",
                  "detalhesAcao": {"horario": "19h-21h"}
                }
              ]
            }
            """;

        List<AiRecommendation> lista = ReflectionTestUtils.invokeMethod(service, "parseMultiResponse", ctx, jsonGemini);

        assertThat(lista).isNotNull().hasSize(2);
        assertThat(lista.get(0).getCategoria()).isEqualTo(RecommendationCategory.ESTOQUE);
        assertThat(lista.get(0).getTitulo()).isEqualTo("Pedido emergencial de insumos");
        assertThat(lista.get(0).getOrigem()).isEqualTo(RecommendationOrigin.IA_GEMINI);
        assertThat(lista.get(0).getPayloadAcao()).containsEntry("tipoAcao", "COMPRA_ESTOQUE");

        assertThat(lista.get(1).getCategoria()).isEqualTo(RecommendationCategory.EQUIPE);
        assertThat(lista.get(1).getTitulo()).isEqualTo("Reforço no turno da noite");
        assertThat(lista.get(1).getPayloadAcao()).containsEntry("tipoAcao", "REFORCO_TURNO");
    }

    @Test
    @DisplayName("ensureAllCategoriesPresent deve completar categorias ausentes usando o fallback")
    void deveCompletarCategoriasAusentes() {
        AiRecommendation recEstoque = new AiRecommendation();
        recEstoque.setCategoria(RecommendationCategory.ESTOQUE);
        recEstoque.setTitulo("Estoque Gemini");
        recEstoque.setOrigem(RecommendationOrigin.IA_GEMINI);

        AiRecommendation fbEquipe = new AiRecommendation();
        fbEquipe.setCategoria(RecommendationCategory.EQUIPE);
        fbEquipe.setTitulo("Equipe Fallback");
        fbEquipe.setOrigem(RecommendationOrigin.HEURISTICA_FALLBACK);

        AiRecommendation fbPromocao = new AiRecommendation();
        fbPromocao.setCategoria(RecommendationCategory.PROMOCAO);
        fbPromocao.setTitulo("Promoção Fallback");
        fbPromocao.setOrigem(RecommendationOrigin.HEURISTICA_FALLBACK);

        AiRecommendation fbPrevisao = new AiRecommendation();
        fbPrevisao.setCategoria(RecommendationCategory.PREVISAO);
        fbPrevisao.setTitulo("Previsão Fallback");
        fbPrevisao.setOrigem(RecommendationOrigin.HEURISTICA_FALLBACK);

        when(heuristicFallback.generateAll(ctx)).thenReturn(List.of(fbEquipe, fbPromocao, fbPrevisao));

        List<AiRecommendation> resultado = ReflectionTestUtils.invokeMethod(
                service, "ensureAllCategoriesPresent", ctx, List.of(recEstoque)
        );

        assertThat(resultado).hasSize(4);
        assertThat(resultado.stream().map(AiRecommendation::getCategoria).toList())
                .containsExactlyInAnyOrder(
                        RecommendationCategory.ESTOQUE,
                        RecommendationCategory.EQUIPE,
                        RecommendationCategory.PROMOCAO,
                        RecommendationCategory.PREVISAO
                );
    }
}
