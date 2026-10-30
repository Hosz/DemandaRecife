package com.uninassau.demandarecife.forecast.calc;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class OperatingDaysTest {

    private static final LocalDate DOMINGO = LocalDate.of(2025, 10, 26);
    private static final LocalDate SEGUNDA = LocalDate.of(2025, 10, 27);

    @Test
    void entendeAbreviacoesSeparadasPorVirgula() {
        var dias = OperatingDays.parse("SEG,TER,QUA");

        assertThat(dias.isOpen(SEGUNDA)).isTrue();
        assertThat(dias.isOpen(DOMINGO)).isFalse();
    }

    @Test
    void entendeNomesCompletosComAcento() {
        var dias = OperatingDays.parse("Segunda-feira; Terça; Sábado");

        assertThat(dias.isOpen(SEGUNDA)).isTrue();
        assertThat(dias.isOpen(LocalDate.of(2025, 10, 28))).isTrue();   // terça
        assertThat(dias.isOpen(LocalDate.of(2025, 11, 1))).isTrue();    // sábado
        assertThat(dias.isOpen(DOMINGO)).isFalse();
    }

    @Test
    void entendeIngles() {
        assertThat(OperatingDays.parse("mon,sun").isOpen(DOMINGO)).isTrue();
    }

    @Test
    void vazioOuNuloAbreTodosOsDias() {
        assertThat(OperatingDays.parse(null).isOpen(DOMINGO)).isTrue();
        assertThat(OperatingDays.parse("  ").isOpen(DOMINGO)).isTrue();
    }

    @Test
    void textoNaoReconhecidoAbreTodosOsDias() {
        assertThat(OperatingDays.parse("1,2,3").isOpen(DOMINGO)).isTrue();
    }
}