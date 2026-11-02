package com.uninassau.demandarecife.forecast.benchmark;

import java.math.BigDecimal;
import java.util.Optional;

public interface BenchmarkProvider {
    /** Média diária estimada do produto no segmento. Vazio se não houver benchmark. */
    Optional<BigDecimal> mediaDiaria(String nicho, String nomeProduto);
}