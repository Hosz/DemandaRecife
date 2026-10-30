package com.uninassau.demandarecife.forecast;

import com.uninassau.demandarecife.forecast.ForecastRepository.TenantSettings;
import com.uninassau.demandarecife.forecast.benchmark.BenchmarkProvider;
import com.uninassau.demandarecife.forecast.dto.ForecastResult.Metodo;
import com.uninassau.demandarecife.products.Product;
import com.uninassau.demandarecife.products.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class DemandForecastServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final LocalDate HOJE = LocalDate.of(2025, 10, 29);      // quarta
    private static final LocalDate QUINTA = LocalDate.of(2025, 10, 30);
    private static final LocalDate DOMINGO = LocalDate.of(2025, 11, 2);

    @Mock ForecastRepository forecastRepository;
    @Mock ProductRepository productRepository;
    @Mock BenchmarkProvider benchmarkProvider;

    DemandForecastService service;
    Product pao;

    @BeforeEach
    void setUp() {
        service = new DemandForecastService(forecastRepository, productRepository, benchmarkProvider);
        pao = new Product();
        pao.setId(UUID.randomUUID());
        pao.setTenantId(TENANT);
        pao.setNome("Pão Francês");
        lenient().when(benchmarkProvider.mediaDiaria(any(), any())).thenReturn(Optional.empty());
    }

    private void cenario(String diasFuncionamento, Map<LocalDate, Integer> vendas, LocalDate primeiraVenda) {
        lenient().when(forecastRepository.configuracoes(TENANT))
                .thenReturn(new TenantSettings("Padaria", diasFuncionamento));
        lenient().when(forecastRepository.vendasPorDia(any(), any(), any()))
                .thenReturn(Map.of(pao.getId(), vendas));
        lenient().when(forecastRepository.primeiraVenda(TENANT))
                .thenReturn(primeiraVenda == null ? Map.of() : Map.of(pao.getId(), primeiraVenda));
        lenient().when(productRepository.findByTenantId(TENANT)).thenReturn(java.util.List.of(pao));
    }

    /** 'valor' por dia de 'de' até 'ate', com domingos diferentes. */
    private Map<LocalDate, Integer> serie(LocalDate de, LocalDate ate, int valor, int valorDomingo) {
        Map<LocalDate, Integer> m = new HashMap<>();
        for (LocalDate d = de; !d.isAfter(ate); d = d.plusDays(1)) {
            m.put(d, d.getDayOfWeek().getValue() == 7 ? valorDomingo : valor);
        }
        return m;
    }

    @Test
    void semHistoricoUsaOBenchmarkQuandoExiste() {
        cenario(null, Map.of(), null);
        lenient().when(benchmarkProvider.mediaDiaria("Padaria", "Pão Francês"))
                .thenReturn(Optional.of(new BigDecimal("12.5")));

        var r = service.forecast(TENANT, QUINTA, HOJE).get(0);

        assertThat(r.metodo()).isEqualTo(Metodo.BENCHMARK);
        assertThat(r.quantidadePrevista()).isEqualByComparingTo("12.50");
    }

    @Test
    void semHistoricoESemBenchmarkRetornaSemDados() {
        cenario(null, Map.of(), null);

        var r = service.forecast(TENANT, QUINTA, HOJE).get(0);

        assertThat(r.metodo()).isEqualTo(Metodo.SEM_DADOS);
        assertThat(r.quantidadePrevista()).isEqualByComparingTo("0");
    }

    @Test
    void poucoHistoricoSemBenchmarkUsaMediaDoQueExiste() {
        var vendas = Map.of(LocalDate.of(2025, 10, 26), 10,
                LocalDate.of(2025, 10, 27), 20,
                LocalDate.of(2025, 10, 28), 30);
        cenario(null, vendas, LocalDate.of(2025, 10, 26));

        var r = service.forecast(TENANT, QUINTA, HOJE).get(0);

        assertThat(r.metodo()).isEqualTo(Metodo.HISTORICO);
        assertThat(r.quantidadePrevista()).isEqualByComparingTo("20.00");
    }

    @Test
    void vendaConstanteGeraPrevisaoIgualAVenda() {
        LocalDate inicio = LocalDate.of(2025, 10, 9);
        cenario(null, serie(inicio, LocalDate.of(2025, 10, 28), 10, 10), inicio);

        var r = service.forecast(TENANT, QUINTA, HOJE).get(0);

        assertThat(r.metodo()).isEqualTo(Metodo.HISTORICO);
        assertThat(r.quantidadePrevista()).isEqualByComparingTo("10.00");
    }

    @Test
    void domingoQueVendeMaisTemPrevisaoMaior() {
        LocalDate inicio = LocalDate.of(2025, 10, 9);
        cenario(null, serie(inicio, LocalDate.of(2025, 10, 28), 10, 20), inicio);

        var domingo = service.forecast(TENANT, DOMINGO, HOJE).get(0).quantidadePrevista();
        var quinta = service.forecast(TENANT, QUINTA, HOJE).get(0).quantidadePrevista();

        assertThat(domingo).isBetween(new BigDecimal("19.80"), new BigDecimal("20.00"));
        assertThat(domingo).isGreaterThan(quinta);
    }

    @Test
    void diaEmQueONegocioNaoAbreTemPrevisaoZero() {
        LocalDate inicio = LocalDate.of(2025, 10, 9);
        cenario("seg,ter,qua,qui,sex,sab", serie(inicio, LocalDate.of(2025, 10, 28), 10, 10), inicio);

        var r = service.forecast(TENANT, DOMINGO, HOJE).get(0);

        assertThat(r.quantidadePrevista()).isEqualByComparingTo("0");
        assertThat(r.metodo()).isEqualTo(Metodo.HISTORICO);
    }
}