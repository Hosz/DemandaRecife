package com.uninassau.demandarecife.recommendations.service;

import com.uninassau.demandarecife.recommendations.dto.MerchantDailyContext;
import com.uninassau.demandarecife.recommendations.entity.AiRecommendation;
import com.uninassau.demandarecife.recommendations.enums.RecommendationCategory;
import com.uninassau.demandarecife.recommendations.enums.RecommendationOrigin;
import com.uninassau.demandarecife.recommendations.enums.RecommendationStatus;
import com.uninassau.demandarecife.replenishment.dto.ReplenishmentSuggestion;
import com.uninassau.demandarecife.team.dto.ShiftDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class HeuristicRecommendationServiceTest {

    private HeuristicRecommendationService service;
    private UUID tenantId;
    private LocalDate hoje;

    @BeforeEach
    void setUp() {
        service = new HeuristicRecommendationService();
        tenantId = UUID.randomUUID();
        hoje = LocalDate.now();
    }

    @Test
    @DisplayName("Cenário 1: Deve priorizar recomendação de ESTOQUE quando há compras críticas pendentes")
    void devePriorizarEstoque() {
        ReplenishmentSuggestion itemCritico = new ReplenishmentSuggestion(
                UUID.randomUUID(),
                "Farinha de Trigo Especial",
                5,
                20,
                50,
                true,
                30,
                ReplenishmentSuggestion.Metodo.PREVISAO
        );

        MerchantDailyContext ctx = new MerchantDailyContext(
                tenantId,
                hoje,
                "SEG",
                "Padaria / Confeitaria",
                "Recife, PE",
                "Boa Viagem",
                "07:00 às 20:00",
                new BigDecimal("35.00"),
                "Ensolarado",
                "29°C",
                List.of("São João (2026-06-24)"), // mesmo tendo feriado, estoque tem prioridade
                List.of(itemCritico),
                "18:00",
                "entre 17h e 19h",
                List.of(new ShiftDto(UUID.randomUUID(), "SEG", "17h–21h", "17:00", "21:00", "alta", "alta", true, List.of())),
                3,
                true
        );

        AiRecommendation rec = service.generate(ctx);

        assertThat(rec.getCategoria()).isEqualTo(RecommendationCategory.ESTOQUE);
        assertThat(rec.getTitulo()).contains("Farinha de Trigo Especial");
        assertThat(rec.getOrigem()).isEqualTo(RecommendationOrigin.HEURISTICA_FALLBACK);
        assertThat(rec.getStatus()).isEqualTo(RecommendationStatus.PENDENTE);
        assertThat(rec.getPayloadAcao()).containsEntry("tipoAcao", "COMPRA_ESTOQUE");
        assertThat(rec.getPayloadAcao()).containsEntry("quantidadeSugerida", 30);
    }

    @Test
    @DisplayName("Cenário 2: Deve sugerir reforço de EQUIPE quando não há risco de estoque mas há turno vago")
    void deveSugerirEquipe() {
        ShiftDto turnoVago = new ShiftDto(
                UUID.randomUUID(),
                "TER",
                "17h–21h",
                "17:00",
                "21:00",
                "alta",
                "alta",
                true, // vaga pendente
                List.of("Lucas")
        );

        MerchantDailyContext ctx = new MerchantDailyContext(
                tenantId,
                hoje,
                "TER",
                "Hamburgueria",
                "Recife, PE",
                "Pina",
                "18:00 às 23:00",
                new BigDecimal("50.00"),
                "Ensolarado",
                "28°C",
                List.of(),
                List.of(), // sem ruptura de estoque
                "20:00",
                "entre 19h e 21h",
                List.of(turnoVago),
                0,
                true
        );

        AiRecommendation rec = service.generate(ctx);

        assertThat(rec.getCategoria()).isEqualTo(RecommendationCategory.EQUIPE);
        assertThat(rec.getTitulo()).contains("17h–21h");
        assertThat(rec.getPayloadAcao()).containsEntry("tipoAcao", "REFORCO_TURNO");
        assertThat(rec.getAcaoSugerida()).contains("17h–21h");
    }

    @Test
    @DisplayName("Cenário 3: Deve sugerir PROMOÇÃO para feriado ou evento próximo quando estoque e equipe estão ok")
    void deveSugerirPromocaoFeriado() {
        MerchantDailyContext ctx = new MerchantDailyContext(
                tenantId,
                hoje,
                "QUA",
                "Restaurante",
                "Recife, PE",
                "Graças",
                "11:00 às 22:00",
                new BigDecimal("65.00"),
                "Ensolarado",
                "27°C",
                List.of("Data Magna de Pernambuco (2026-03-06)"),
                List.of(),
                "12:00",
                "entre 12h e 14h",
                List.of(new ShiftDto(UUID.randomUUID(), "QUA", "11h–15h", "11:00", "15:00", "alta", "alta", false, List.of("Mariana", "Carlos"))),
                0,
                true
        );

        AiRecommendation rec = service.generate(ctx);

        assertThat(rec.getCategoria()).isEqualTo(RecommendationCategory.PROMOCAO);
        assertThat(rec.getDiagnostico()).contains("Data Magna de Pernambuco");
        assertThat(rec.getPayloadAcao()).containsEntry("tipoAcao", "CRIAR_PROMOCAO");
    }

    @Test
    @DisplayName("Cenário 4: Deve sugerir ajuste ao CLIMA quando há chuva prevista")
    void deveSugerirClimaChuva() {
        MerchantDailyContext ctx = new MerchantDailyContext(
                tenantId,
                hoje,
                "QUI",
                "Cafeteria",
                "Recife, PE",
                "Espinheiro",
                "08:00 às 19:00",
                new BigDecimal("28.00"),
                "Chuva Moderada",
                "24°C",
                List.of(),
                List.of(),
                "16:00",
                "entre 15h e 17h",
                List.of(),
                0,
                true
        );

        AiRecommendation rec = service.generate(ctx);

        assertThat(rec.getCategoria()).isEqualTo(RecommendationCategory.PREVISAO);
        assertThat(rec.getTitulo()).contains("Chuva Prevista");
        assertThat(rec.getPayloadAcao()).containsEntry("tipoAcao", "FOCO_DELIVERY");
    }

    @Test
    @DisplayName("Cenário 5: Deve gerar recomendação de PREVISAO operacional em dia padrão sem anomalias")
    void deveGerarBenchmarkPadrao() {
        MerchantDailyContext ctx = new MerchantDailyContext(
                tenantId,
                hoje,
                "SEX",
                "Pizzaria",
                "Recife, PE",
                "Madalena",
                "18:00 às 23:30",
                new BigDecimal("70.00"),
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

        AiRecommendation rec = service.generate(ctx);

        assertThat(rec.getCategoria()).isEqualTo(RecommendationCategory.PREVISAO);
        assertThat(rec.getTitulo()).contains("Previsão");
        assertThat(rec.getDiagnostico()).contains("20:00");
        assertThat(rec.getPayloadAcao()).containsEntry("tipoAcao", "PREPARO_PICO");
    }

    @Test
    @DisplayName("generateAll deve retornar exatamente 4 recomendações cobrindo ESTOQUE, EQUIPE, PROMOCAO e PREVISAO")
    void deveGerarParaTodasAsQuatroAreas() {
        MerchantDailyContext ctx = new MerchantDailyContext(
                tenantId,
                hoje,
                "SEX",
                "Pizzaria",
                "Recife, PE",
                "Madalena",
                "18:00 às 23:30",
                new BigDecimal("70.00"),
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

        List<AiRecommendation> todas = service.generateAll(ctx);

        assertThat(todas).hasSize(4);
        List<RecommendationCategory> categorias = todas.stream().map(AiRecommendation::getCategoria).toList();
        assertThat(categorias).containsExactlyInAnyOrder(
                RecommendationCategory.ESTOQUE,
                RecommendationCategory.EQUIPE,
                RecommendationCategory.PROMOCAO,
                RecommendationCategory.PREVISAO
        );
    }
}
