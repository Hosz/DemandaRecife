package com.uninassau.demandarecife.forecast.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ForecastResult(
        UUID productId,
        LocalDate data,
        BigDecimal quantidadePrevista,
        Metodo metodo
) {
    public enum Metodo { HISTORICO, BENCHMARK, SEM_DADOS }
}