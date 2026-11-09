package com.uninassau.demandarecife.sales.dto;

import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record SaleRequest(
        UUID productId,
        @Size(max = 120, message = "O nome do produto deve ter no máximo 120 caracteres")
        String productName,
        @NotNull @Positive Integer quantidade,
        @NotNull @Positive BigDecimal precoUnitario,
        @NotNull @PastOrPresent LocalDateTime dataHoraVenda
) {
    public SaleRequest(UUID productId, Integer quantidade, BigDecimal precoUnitario, LocalDateTime dataHoraVenda) {
        this(productId, null, quantidade, precoUnitario, dataHoraVenda);
    }

    public SaleRequest {
        if (productId == null && (productName == null || productName.trim().isBlank())) {
            throw new IllegalArgumentException("Informe o produto cadastrado ou o nome de um novo produto.");
        }
    }
}
