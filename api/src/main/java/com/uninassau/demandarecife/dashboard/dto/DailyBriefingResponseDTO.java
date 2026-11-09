package com.uninassau.demandarecife.dashboard.dto;

import com.uninassau.demandarecife.alerts.dto.AlertResponse;
import com.uninassau.demandarecife.replenishment.dto.ReplenishmentSuggestion;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
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
        OpportunityDTO opportunity
) {
    public DailyBriefingResponseDTO(
            LocalDate data,
            List<AlertResponse> alertas,
            List<ReplenishmentSuggestion> compras,
            List<PrevisaoVenda> previsaoVendas,
            List<String> secoesComFalha
    ) {
        this(data, alertas, compras, previsaoVendas, secoesComFalha, null, null, null, null);
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
}
