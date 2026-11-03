package com.uninassau.demandarecife.forecast.calc;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.Map;

public final class WeekdaySeasonality {

    private WeekdaySeasonality() {}

    /**
     * Fator de cada dia da semana = média daquele dia / média geral.
     * Domingo com fator 1,5 vende 50% acima da média. Sem dados: fator 1.
     * Usa a mesma regra de dias contados da média móvel.
     */
    public static Map<DayOfWeek, BigDecimal> factors(Map<LocalDate, Integer> vendasPorDia,
                                                     LocalDate inicio,
                                                     LocalDate fim,
                                                     OperatingDays diasAbertos) {
        Map<DayOfWeek, Long> soma = new EnumMap<>(DayOfWeek.class);
        Map<DayOfWeek, Integer> contagem = new EnumMap<>(DayOfWeek.class);
        long somaGeral = 0;
        int contagemGeral = 0;

        for (LocalDate dia = inicio; !dia.isAfter(fim); dia = dia.plusDays(1)) {
            int vendido = vendasPorDia.getOrDefault(dia, 0);
            if (diasAbertos.isOpen(dia) || vendido > 0) {
                soma.merge(dia.getDayOfWeek(), (long) vendido, Long::sum);
                contagem.merge(dia.getDayOfWeek(), 1, Integer::sum);
                somaGeral += vendido;
                contagemGeral++;
            }
        }

        Map<DayOfWeek, BigDecimal> fatores = new EnumMap<>(DayOfWeek.class);
        for (DayOfWeek d : DayOfWeek.values()) fatores.put(d, BigDecimal.ONE);
        if (contagemGeral == 0 || somaGeral == 0) return fatores;

        BigDecimal mediaGeral = BigDecimal.valueOf(somaGeral)
                .divide(BigDecimal.valueOf(contagemGeral), 6, RoundingMode.HALF_UP);

        for (DayOfWeek d : DayOfWeek.values()) {
            int n = contagem.getOrDefault(d, 0);
            if (n == 0) continue;
            BigDecimal mediaDia = BigDecimal.valueOf(soma.get(d))
                    .divide(BigDecimal.valueOf(n), 6, RoundingMode.HALF_UP);
            fatores.put(d, mediaDia.divide(mediaGeral, 4, RoundingMode.HALF_UP));
        }
        return fatores;
    }
}