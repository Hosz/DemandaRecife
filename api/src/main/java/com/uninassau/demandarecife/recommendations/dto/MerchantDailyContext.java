package com.uninassau.demandarecife.recommendations.dto;

import com.uninassau.demandarecife.replenishment.dto.ReplenishmentSuggestion;
import com.uninassau.demandarecife.team.dto.ShiftDto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MerchantDailyContext(
        UUID tenantId,
        LocalDate data,
        String diaSemana,
        String nicho,
        String cidade,
        String bairro,
        String horarios,
        BigDecimal ticketMedio,
        String climaCondicao,
        String climaTemperatura,
        List<String> feriadosProximos,
        List<ReplenishmentSuggestion> comprasCriticas,
        String horarioPico,
        String faixaPico,
        List<ShiftDto> turnosDoDia,
        int totalAlertasAtivos,
        boolean usarBenchmarks
) {}
