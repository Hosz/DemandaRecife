package com.uninassau.demandarecife.promotions.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CampaignDto(
        UUID id,
        UUID productId,
        String titulo,
        String detalhe,
        int descontoPercentual,
        BigDecimal precoPromocional,
        String status,
        String data,
        String dataFim,
        String eventoVinculado,
        String horarioInicio,
        String horarioFim,
        List<UUID> productIds
) {
    public CampaignDto(UUID id, UUID productId, String titulo, String detalhe,
                       int descontoPercentual, BigDecimal precoPromocional, String status, String data) {
        this(id, productId, titulo, detalhe, descontoPercentual, precoPromocional, status, data, null, null, null, null, null);
    }

    public CampaignDto(UUID id, UUID productId, String titulo, String detalhe,
                       int descontoPercentual, BigDecimal precoPromocional, String status,
                       String data, String dataFim, String eventoVinculado) {
        this(id, productId, titulo, detalhe, descontoPercentual, precoPromocional, status, data, dataFim, eventoVinculado, null, null, null);
    }
}
