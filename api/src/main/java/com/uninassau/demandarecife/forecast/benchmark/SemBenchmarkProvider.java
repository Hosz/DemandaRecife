package com.uninassau.demandarecife.forecast.benchmark;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Optional;

/** Provisório até o RF07. A implementação real entra com @Primary. */
@Component
class SemBenchmarkProvider implements BenchmarkProvider {

    @Override
    public Optional<BigDecimal> mediaDiaria(String nicho, String nomeProduto) {
        return Optional.empty();
    }
}