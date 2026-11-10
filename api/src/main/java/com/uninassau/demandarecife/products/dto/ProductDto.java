package com.uninassau.demandarecife.products.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductDto(
        UUID id,
        String nome,
        String sku,
        BigDecimal precoVenda,
        BigDecimal custoUnidade
) {}
