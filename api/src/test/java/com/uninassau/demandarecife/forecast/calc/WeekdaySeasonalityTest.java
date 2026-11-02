package com.uninassau.demandarecife.forecast.calc;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class WeekdaySeasonalityTest {

    // 06/10/2025 (segunda) a 19/10/2025 (domingo): duas semanas completas
    private static final LocalDate INICIO = LocalDate.of(2025, 10, 6);
    private static final LocalDate FIM = LocalDate.of(2025, 10, 19);

    private Map<LocalDate, Integer> semana(int seg_sab, int domingo) {
        Map<LocalDate, Integer> vendas = new HashMap<>();
        for (LocalDate d = INICIO; !d.isAfter(FIM); d = d.plusDays(1)) {
            vendas.put(d, d.getDayOfWeek() == DayOfWeek.SUNDAY ? domingo : seg_sab);
        }
        return vendas;
    }

    @Test
    void domingoQueVendeoDobroTemFatorMaiorQueUm() {
        var fatores = WeekdaySeasonality.factors(semana(10, 20), INICIO, FIM, OperatingDays.todosOsDias());

        assertThat(fatores.get(DayOfWeek.SUNDAY)).isCloseTo(new BigDecimal("1.75"), within(new BigDecimal("0.001")));
        assertThat(fatores.get(DayOfWeek.MONDAY)).isCloseTo(new BigDecimal("0.875"), within(new BigDecimal("0.001")));
    }

    @Test
    void diaFechadoNaoPuxaAMediaParaBaixo() {
        var fatores = WeekdaySeasonality.factors(semana(10, 0), INICIO, FIM, OperatingDays.parse("seg,ter,qua,qui,sex,sab"));

        assertThat(fatores.get(DayOfWeek.MONDAY)).isEqualByComparingTo("1");
        assertThat(fatores.get(DayOfWeek.SUNDAY)).isEqualByComparingTo("1");   // fechado: neutro
    }

    @Test
    void semVendasTodosOsFatoresSaoUm() {
        var fatores = WeekdaySeasonality.factors(Map.of(), INICIO, FIM, OperatingDays.todosOsDias());

        assertThat(fatores.values()).allSatisfy(f -> assertThat(f).isEqualByComparingTo("1"));
    }
}