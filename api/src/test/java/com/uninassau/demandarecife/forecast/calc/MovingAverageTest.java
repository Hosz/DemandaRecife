package com.uninassau.demandarecife.forecast.calc;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class MovingAverageTest {

    // 26/10/2025 = domingo, 27 = segunda, 28 = terça, 29 = quarta (hoje)
    private static final LocalDate HOJE = LocalDate.of(2025, 10, 29);
    private static final LocalDate D26 = LocalDate.of(2025, 10, 26);
    private static final LocalDate D27 = LocalDate.of(2025, 10, 27);
    private static final LocalDate D28 = LocalDate.of(2025, 10, 28);

    @Test
    void diaAbertoSemVendaContaComoZero() {
        Map<LocalDate, Integer> vendas = Map.of(D26, 10, D28, 10);   // 27 sem venda

        var media = MovingAverage.calculate(vendas, D26, HOJE, 3, OperatingDays.todosOsDias());

        assertThat(media).isEqualByComparingTo("6.67");
    }

    @Test
    void diaFechadoSemVendaNaoEntraNaMedia() {
        Map<LocalDate, Integer> vendas = Map.of(D27, 10, D28, 10);   // domingo fechado

        var media = MovingAverage.calculate(vendas, D26, HOJE, 3, OperatingDays.parse("seg,ter,qua"));

        assertThat(media).isEqualByComparingTo("10.00");
    }

    @Test
    void diaFechadoComVendaContaMesmoAssim() {
        Map<LocalDate, Integer> vendas = Map.of(D26, 6, D27, 10, D28, 8);

        var media = MovingAverage.calculate(vendas, D26, HOJE, 3, OperatingDays.parse("seg,ter,qua"));

        assertThat(media).isEqualByComparingTo("8.00");
    }

    @Test
    void janelaNaoComecaAntesDoHistorico() {
        Map<LocalDate, Integer> vendas = Map.of(D27, 10, D28, 20);

        var media = MovingAverage.calculate(vendas, D27, HOJE, 30, OperatingDays.todosOsDias());

        assertThat(media).isEqualByComparingTo("15.00");   // 2 dias de histórico, não 30
    }

    @Test
    void hojeNaoEntraNoCalculo() {
        Map<LocalDate, Integer> vendas = new HashMap<>();
        vendas.put(D28, 10);
        vendas.put(HOJE, 999);   // dia ainda em andamento

        var media = MovingAverage.calculate(vendas, D28, HOJE, 7, OperatingDays.todosOsDias());

        assertThat(media).isEqualByComparingTo("10.00");
    }

    @Test
    void semHistoricoRetornaZero() {
        var media = MovingAverage.calculate(Map.of(), HOJE, HOJE, 7, OperatingDays.todosOsDias());

        assertThat(media).isEqualByComparingTo("0");
    }
}