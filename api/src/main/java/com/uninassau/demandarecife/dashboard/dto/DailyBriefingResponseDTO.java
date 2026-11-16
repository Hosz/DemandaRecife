package com.uninassau.demandarecife.dashboard.dto;

import com.uninassau.demandarecife.alerts.dto.AlertResponse;
import com.uninassau.demandarecife.recommendations.dto.AiRecommendationDto;
import com.uninassau.demandarecife.recommendations.enums.RecommendationOrigin;
import com.uninassau.demandarecife.replenishment.dto.ReplenishmentSuggestion;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record DailyBriefingResponseDTO(
        LocalDate data,
        List<AlertResponse> alertas,
        List<ReplenishmentSuggestion> compras,
        List<PrevisaoVenda> previsaoVendas,
        List<String> secoesComFalha,
        WeatherDTO weather,
        MetricsDTO metrics,
        List<CustomerFlowDTO> customerFlow,
        OpportunityDTO opportunity,
        AiInsightDTO aiInsight,
        List<AiInsightDTO> aiInsights
) {
    public DailyBriefingResponseDTO(
            LocalDate data,
            List<AlertResponse> alertas,
            List<ReplenishmentSuggestion> compras,
            List<PrevisaoVenda> previsaoVendas,
            List<String> secoesComFalha,
            WeatherDTO weather,
            MetricsDTO metrics,
            List<CustomerFlowDTO> customerFlow,
            OpportunityDTO opportunity,
            AiInsightDTO aiInsight
    ) {
        this(data, alertas, compras, previsaoVendas, secoesComFalha, weather, metrics, customerFlow, opportunity,
                aiInsight, aiInsight != null ? List.of(aiInsight) : List.of());
    }

    public DailyBriefingResponseDTO(
            LocalDate data,
            List<AlertResponse> alertas,
            List<ReplenishmentSuggestion> compras,
            List<PrevisaoVenda> previsaoVendas,
            List<String> secoesComFalha,
            WeatherDTO weather,
            MetricsDTO metrics,
            List<CustomerFlowDTO> customerFlow,
            OpportunityDTO opportunity
    ) {
        this(data, alertas, compras, previsaoVendas, secoesComFalha, weather, metrics, customerFlow, opportunity, null, List.of());
    }

    public DailyBriefingResponseDTO(
            LocalDate data,
            List<AlertResponse> alertas,
            List<ReplenishmentSuggestion> compras,
            List<PrevisaoVenda> previsaoVendas,
            List<String> secoesComFalha
    ) {
        this(data, alertas, compras, previsaoVendas, secoesComFalha, null, null, null, null, null, List.of());
    }

    public record PrevisaoVenda(UUID productId, String produto, BigDecimal quantidadePrevista) {}
    public record WeatherDTO(String temp, String condition, String location, String date) {}
    public record MetricsDTO(
            String salesForecast,
            String salesDiff,
            String peakHour,
            String peakRange,
            int stockAlertsCount,
            String modelAccuracy,
            String accuracyDiff,
            boolean isRegionalEstimate
    ) {
        public MetricsDTO(
                String salesForecast,
                String salesDiff,
                String peakHour,
                String peakRange,
                int stockAlertsCount,
                String modelAccuracy,
                String accuracyDiff
        ) {
            this(salesForecast, salesDiff, peakHour, peakRange, stockAlertsCount, modelAccuracy, accuracyDiff, false);
        }
    }
    public record CustomerFlowDTO(String hour, int value, boolean highlight) {}
    public record OpportunityDTO(String title, String description) {}

    public record AiInsightDTO(
            UUID id,
            String categoria,
            String title,
            String text,
            String diagnostico,
            String acaoSugerida,
            String impacto,
            String origem,
            boolean fallback,
            String status,
            Map<String, Object> payloadAcao
    ) {
        public AiInsightDTO(
                UUID id,
                String categoria,
                String title,
                String text,
                String diagnostico,
                String acaoSugerida,
                String impacto,
                String origem,
                String status,
                Map<String, Object> payloadAcao
        ) {
            this(id, categoria, title, text, diagnostico, acaoSugerida, impacto, origem,
                    "HEURISTICA_FALLBACK".equalsIgnoreCase(origem), status, payloadAcao);
        }

        public static AiInsightDTO fromRecommendation(AiRecommendationDto rec) {
            if (rec == null) return null;
            String fullText = (rec.diagnostico() != null ? rec.diagnostico() + " " : "") +
                    (rec.acaoSugerida() != null ? rec.acaoSugerida() : "");
            boolean isFallback = rec.origem() == RecommendationOrigin.HEURISTICA_FALLBACK;
            return new AiInsightDTO(
                    rec.id(),
                    rec.categoria() != null ? rec.categoria().name() : null,
                    rec.titulo(),
                    fullText.trim(),
                    rec.diagnostico(),
                    rec.acaoSugerida(),
                    rec.impactoEstimado(),
                    rec.origem() != null ? rec.origem().name() : null,
                    isFallback,
                    rec.status() != null ? rec.status().name() : null,
                    rec.payloadAcao()
            );
        }
    }
}
