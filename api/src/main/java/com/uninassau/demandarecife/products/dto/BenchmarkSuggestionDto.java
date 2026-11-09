package com.uninassau.demandarecife.products.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record BenchmarkSuggestionDto(
        UUID id,
        String nomeSugerido,
        String categoria,
        BigDecimal precoSugerido,
        BigDecimal mediaDiaria,
        String unidade
) {}
