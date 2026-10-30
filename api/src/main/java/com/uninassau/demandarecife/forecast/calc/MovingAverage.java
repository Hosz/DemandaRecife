package com.uninassau.demandarecife.forecast.calc;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Map;

public final class MovingAverage {

    private MovingAverage() {}

    /**
     * Média diária dos últimos {@code janelaDias} dias (sem contar hoje).
     * - Dia aberto sem venda conta como zero.
     * - Dia fechado fica de fora, a não ser que tenha havido venda nele.
     * - A janela nunca começa antes do início do histórico do produto.
     */
    public static BigDecimal calculate(Map<LocalDate, Integer> vendasPorDia,
                                       LocalDate inicioHistorico,
                                       LocalDate hoje,
                                       int janelaDias,
                                       OperatingDays diasAbertos) {
        LocalDate inicioJanela = hoje.minusDays(janelaDias);
        LocalDate inicio = inicioJanela.isAfter(inicioHistorico) ? inicioJanela : inicioHistorico;
        LocalDate fim = hoje.minusDays(1);

        long total = 0;
        int diasContados = 0;
        for (LocalDate dia = inicio; !dia.isAfter(fim); dia = dia.plusDays(1)) {
            int vendido = vendasPorDia.getOrDefault(dia, 0);
            if (diasAbertos.isOpen(dia) || vendido > 0) {
                total += vendido;
                diasContados++;
            }
        }
        if (diasContados == 0) return BigDecimal.ZERO;
        return BigDecimal.valueOf(total)
                .divide(BigDecimal.valueOf(diasContados), 2, RoundingMode.HALF_UP);
    }
}