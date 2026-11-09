package com.uninassau.demandarecife.promotions.dto;

import java.math.BigDecimal;
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
        String eventoVinculado
) {
    public CampaignDto(UUID id, UUID productId, String titulo, String detalhe,
                       int descontoPercentual, BigDecimal precoPromocional, String status, String data) {
        this(id, productId, titulo, detalhe, descontoPercentual, precoPromocional, status, data, null, null);
    }
}
