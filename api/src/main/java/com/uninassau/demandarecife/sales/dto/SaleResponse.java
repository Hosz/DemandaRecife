package com.uninassau.demandarecife.sales.dto;

import com.uninassau.demandarecife.sales.SaleTransaction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record SaleResponse(
        UUID id,
        UUID productId,
        Integer quantidade,
        BigDecimal precoUnitario,
        LocalDateTime dataHoraVenda,
        String origem
) {
    public static SaleResponse from(SaleTransaction s) {
        return new SaleResponse(
                s.getId(), s.getProductId(), s.getQuantidade(),
                s.getPrecoUnitario(), s.getDataHoraVenda(), s.getOrigem());
    }
}
