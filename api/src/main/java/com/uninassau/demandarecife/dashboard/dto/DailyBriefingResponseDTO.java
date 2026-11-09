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
        List<String> secoesComFalha
) {
    public record PrevisaoVenda(UUID productId, String produto, BigDecimal quantidadePrevista) {}
}