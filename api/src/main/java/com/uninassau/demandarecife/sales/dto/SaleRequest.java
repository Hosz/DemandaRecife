package com.uninassau.demandarecife.sales.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record SaleRequest(
        @NotNull UUID productId,
        @NotNull @Positive Integer quantidade,
        @NotNull @Positive BigDecimal precoUnitario,
        @NotNull @PastOrPresent LocalDateTime dataHoraVenda
) {}
