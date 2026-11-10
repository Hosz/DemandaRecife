package com.uninassau.demandarecife.forecast.benchmark;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DatabaseBenchmarkProviderTest {

    @Mock
    private MarketBenchmarkRepository repository;

    private DatabaseBenchmarkProvider provider;

    @BeforeEach
    void setUp() {
        provider = new DatabaseBenchmarkProvider(repository);
    }

    @Test
    void retornaMediaQuandoEncontraCorrespondenciaExataOuParcial() {
        var b1 = new MarketBenchmark("padaria", "pao frances", "Pão Francês Tradicional", "Panificação",
                new BigDecimal("0.85"), new BigDecimal("320.00"), "UN", true);
        var b2 = new MarketBenchmark("padaria", "pao de queijo", "Pão de Queijo Mineiro", "Salgados",
                new BigDecimal("4.50"), new BigDecimal("65.00"), "UN", true);

        when(repository.findByNicho("padaria")).thenReturn(List.of(b1, b2));

        Optional<BigDecimal> resultado = provider.mediaDiaria("Padaria / Confeitaria", "Pão Francês Especial");

        assertThat(resultado).isPresent();
        assertThat(resultado.get()).isEqualByComparingTo("320.00");
    }

    @Test
    void priorizaTermosMaisEspecificosSobreTermosCurtos() {
        var bPao = new MarketBenchmark("padaria", "pao", "Pão Geral", "Panificação",
                new BigDecimal("1.00"), new BigDecimal("100.00"), "UN", false);
        var bPaoQueijo = new MarketBenchmark("padaria", "pao de queijo", "Pão de Queijo Mineiro", "Salgados",
                new BigDecimal("4.50"), new BigDecimal("65.00"), "UN", true);

        when(repository.findByNicho("padaria")).thenReturn(List.of(bPao, bPaoQueijo));

        Optional<BigDecimal> resultado = provider.mediaDiaria("Padaria", "Pão de queijo da casa");

        assertThat(resultado).isPresent();
        assertThat(resultado.get()).isEqualByComparingTo("65.00");
    }

    @Test
    void retornaVazioQuandoNaoHaCorrespondencia() {
        var b1 = new MarketBenchmark("padaria", "pao frances", "Pão Francês Tradicional", "Panificação",
                new BigDecimal("0.85"), new BigDecimal("320.00"), "UN", true);

        when(repository.findByNicho("padaria")).thenReturn(List.of(b1));

        Optional<BigDecimal> resultado = provider.mediaDiaria("Padaria", "Torta Holandesa");

        assertThat(resultado).isEmpty();
    }

    @Test
    void normalizaSubsegmentosGranularesCorretamente() {
        var bBurger = new MarketBenchmark("hamburgueria", "hamburguer artesanal", "Hambúrguer Artesanal", "Lanches",
                new BigDecimal("28.00"), new BigDecimal("55.00"), "UN", true);
        when(repository.findByNicho("hamburgueria")).thenReturn(List.of(bBurger));

        Optional<BigDecimal> burger = provider.mediaDiaria("Hamburgueria, Lanchonete & Pastelaria", "Hambúrguer Artesanal Smash Duplo");
        assertThat(burger).isPresent();
        assertThat(burger.get()).isEqualByComparingTo("55.00");

        var bBarba = new MarketBenchmark("barbearia", "corte degrade", "Corte Masculino / Degradê", "Cabelo",
                new BigDecimal("35.00"), new BigDecimal("14.00"), "ATENDIMENTO", true);
        when(repository.findByNicho("barbearia")).thenReturn(List.of(bBarba));

        Optional<BigDecimal> barba = provider.mediaDiaria("Barbearia Retrô", "Corte degradê na tesoura");
        assertThat(barba).isPresent();
        assertThat(barba.get()).isEqualByComparingTo("14.00");
    }

    @Test
    void retornaVazioComEntradasNulasOuVazias() {
        assertThat(provider.mediaDiaria(null, "Pão")).isEmpty();
        assertThat(provider.mediaDiaria("Padaria", null)).isEmpty();
        assertThat(provider.mediaDiaria("", "")).isEmpty();
    }
}
