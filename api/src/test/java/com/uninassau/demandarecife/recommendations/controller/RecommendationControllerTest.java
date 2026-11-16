package com.uninassau.demandarecife.recommendations.controller;

import com.uninassau.demandarecife.recommendations.dto.AiRecommendationDto;
import com.uninassau.demandarecife.recommendations.enums.RecommendationCategory;
import com.uninassau.demandarecife.recommendations.enums.RecommendationOrigin;
import com.uninassau.demandarecife.recommendations.enums.RecommendationStatus;
import com.uninassau.demandarecife.recommendations.service.RecommendationOrchestratorService;
import com.uninassau.demandarecife.shared.exception.ApiExceptionHandler;
import com.uninassau.demandarecife.shared.exception.ResourceNotFoundException;
import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RecommendationControllerTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock
    private RecommendationOrchestratorService orchestrator;

    @Mock
    private CurrentTenant currentTenant;

    @InjectMocks
    private RecommendationController controller;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
        lenient().when(currentTenant.id()).thenReturn(TENANT);
    }

    @Test
    @DisplayName("GET /api/recommendations/daily deve retornar a lista de recomendações por área do dia")
    void deveRetornarRecomendacoesDiarias() throws Exception {
        UUID recId = UUID.randomUUID();
        AiRecommendationDto dto = new AiRecommendationDto(
                recId,
                LocalDate.now(),
                RecommendationCategory.EQUIPE,
                "Reforço de Escala no Fechamento",
                "Pico às 18h",
                "Adicionar 1 colaborador das 17h às 21h",
                "+15% conversão",
                RecommendationOrigin.IA_GEMINI,
                RecommendationStatus.PENDENTE,
                Map.of("tipoAcao", "REFORCO_TURNO")
        );

        when(orchestrator.getDailyRecommendations(eq(TENANT), isNull())).thenReturn(List.of(dto));

        mvc.perform(get("/api/recommendations/daily"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(recId.toString()))
                .andExpect(jsonPath("$[0].categoria").value("EQUIPE"))
                .andExpect(jsonPath("$[0].titulo").value("Reforço de Escala no Fechamento"))
                .andExpect(jsonPath("$[0].origem").value("IA_GEMINI"))
                .andExpect(jsonPath("$[0].status").value("PENDENTE"));
    }

    @Test
    @DisplayName("PATCH /api/recommendations/{id}/apply deve marcar status como APLICADO")
    void deveAplicarRecomendacao() throws Exception {
        UUID recId = UUID.randomUUID();
        AiRecommendationDto dto = new AiRecommendationDto(
                recId,
                LocalDate.now(),
                RecommendationCategory.EQUIPE,
                "Reforço de Escala no Fechamento",
                "Pico às 18h",
                "Adicionar 1 colaborador",
                "+15% conversão",
                RecommendationOrigin.IA_GEMINI,
                RecommendationStatus.APLICADO,
                Map.of()
        );

        when(orchestrator.applyRecommendation(TENANT, recId)).thenReturn(dto);

        mvc.perform(patch("/api/recommendations/{id}/apply", recId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APLICADO"));
    }

    @Test
    @DisplayName("PATCH /api/recommendations/{id}/dismiss deve marcar status como DISPENSADO")
    void deveDispensarRecomendacao() throws Exception {
        UUID recId = UUID.randomUUID();
        AiRecommendationDto dto = new AiRecommendationDto(
                recId,
                LocalDate.now(),
                RecommendationCategory.EQUIPE,
                "Reforço de Escala no Fechamento",
                "Pico às 18h",
                "Adicionar 1 colaborador",
                "+15% conversão",
                RecommendationOrigin.IA_GEMINI,
                RecommendationStatus.DISPENSADO,
                Map.of()
        );

        when(orchestrator.dismissRecommendation(TENANT, recId)).thenReturn(dto);

        mvc.perform(patch("/api/recommendations/{id}/dismiss", recId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISPENSADO"));
    }

    @Test
    @DisplayName("PATCH /api/recommendations/{id}/apply quando recomendação não existe deve retornar 404")
    void deveRetornar404QuandoNaoEncontrada() throws Exception {
        UUID recId = UUID.randomUUID();
        when(orchestrator.applyRecommendation(TENANT, recId))
                .thenThrow(new ResourceNotFoundException("Recomendação não encontrada."));

        mvc.perform(patch("/api/recommendations/{id}/apply", recId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/recommendations/regenerate deve recalcular e retornar lista de recomendações atualizada")
    void deveRegenerarRecomendacao() throws Exception {
        UUID recId = UUID.randomUUID();
        AiRecommendationDto dto = new AiRecommendationDto(
                recId,
                LocalDate.now(),
                RecommendationCategory.PROMOCAO,
                "Nova Ação Promocional de Teste",
                "Feriado próximo",
                "Aplicar desconto no combo",
                "+20% giro",
                RecommendationOrigin.IA_GEMINI,
                RecommendationStatus.PENDENTE,
                Map.of("tipoAcao", "CAMPANHA_PROMOCIONAL")
        );

        when(orchestrator.regenerateDailyRecommendations(eq(TENANT), isNull())).thenReturn(List.of(dto));

        mvc.perform(post("/api/recommendations/regenerate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(recId.toString()))
                .andExpect(jsonPath("$[0].categoria").value("PROMOCAO"))
                .andExpect(jsonPath("$[0].titulo").value("Nova Ação Promocional de Teste"))
                .andExpect(jsonPath("$[0].origem").value("IA_GEMINI"))
                .andExpect(jsonPath("$[0].status").value("PENDENTE"));
    }
}
