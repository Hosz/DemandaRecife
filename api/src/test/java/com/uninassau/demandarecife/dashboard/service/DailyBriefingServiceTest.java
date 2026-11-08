package com.uninassau.demandarecife.dashboard.service;

import com.uninassau.demandarecife.alerts.service.AlertService;
import com.uninassau.demandarecife.forecast.dto.ForecastResult;
import com.uninassau.demandarecife.forecast.dto.ForecastResult.Metodo;
import com.uninassau.demandarecife.forecast.service.DemandForecastService;
import com.uninassau.demandarecife.products.entity.Product;
import com.uninassau.demandarecife.products.repository.ProductRepository;
import com.uninassau.demandarecife.replenishment.dto.ReplenishmentSuggestion;
import com.uninassau.demandarecife.replenishment.service.ReplenishmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DailyBriefingServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock AlertService alertService;
    @Mock ReplenishmentService replenishmentService;
    @Mock DemandForecastService forecastService;
    @Mock ProductRepository productRepository;

    DailyBriefingService service;
    Product pao;

    @BeforeEach
    void setUp() {
        service = new DailyBriefingService(alertService, replenishmentService, forecastService, productRepository);
        pao = new Product();
        pao.setId(UUID.randomUUID());
        pao.setNome("Pão Francês");
        lenient().when(productRepository.findByTenantId(TENANT)).thenReturn(List.of(pao));
        lenient().when(alertService.listar(TENANT, "ATIVO", false)).thenReturn(List.of());
        lenient().when(replenishmentService.suggestions(TENANT)).thenReturn(List.of());
        lenient().when(forecastService.forecast(eq(TENANT), any())).thenReturn(List.of());
    }

    private ForecastResult previsao(UUID id, double qtd, Metodo metodo) {
        return new ForecastResult(id, LocalDate.now(), BigDecimal.valueOf(qtd), metodo);
    }

    private ReplenishmentSuggestion sugestao(boolean comprar) {
        return new ReplenishmentSuggestion(UUID.randomUUID(), "Item", 1, 5, 10, comprar,
                comprar ? 9 : 0, ReplenishmentSuggestion.Metodo.PREVISAO);
    }

    @Test
    void montaAsTresSecoesSemFalhas() {
        when(forecastService.forecast(eq(TENANT), any()))
                .thenReturn(List.of(previsao(pao.getId(), 40, Metodo.HISTORICO)));
        when(replenishmentService.suggestions(TENANT)).thenReturn(List.of(sugestao(true)));

        var r = service.montar(TENANT);

        assertThat(r.secoesComFalha()).isEmpty();
        assertThat(r.compras()).hasSize(1);
        assertThat(r.previsaoVendas()).singleElement()
                .satisfies(p -> assertThat(p.produto()).isEqualTo("Pão Francês"));
    }

    @Test
    void secaoQueFalhaVemVaziaEAsOutrasContinuam() {
        when(alertService.listar(TENANT, "ATIVO", false)).thenThrow(new RuntimeException("erro"));
        when(replenishmentService.suggestions(TENANT)).thenReturn(List.of(sugestao(true)));

        var r = service.montar(TENANT);

        assertThat(r.alertas()).isEmpty();
        assertThat(r.secoesComFalha()).containsExactly("alertas");
        assertThat(r.compras()).hasSize(1);
    }

    @Test
    void comprasTrazSoOQuePrecisaComprarELimitaEm10() {
        List<ReplenishmentSuggestion> todas = new ArrayList<>();
        for (int i = 0; i < 15; i++) todas.add(sugestao(true));
        todas.add(sugestao(false));
        when(replenishmentService.suggestions(TENANT)).thenReturn(todas);

        assertThat(service.montar(TENANT).compras()).hasSize(10);
    }

    @Test
    void previsaoIgnoraSemDadosOrdenaPeloMaiorELimitaEm10() {
        List<ForecastResult> lista = new ArrayList<>();
        for (int i = 1; i <= 12; i++) lista.add(previsao(UUID.randomUUID(), i, Metodo.HISTORICO));
        lista.add(previsao(UUID.randomUUID(), 0, Metodo.SEM_DADOS));
        when(forecastService.forecast(eq(TENANT), any())).thenReturn(lista);

        var previsoes = service.montar(TENANT).previsaoVendas();

        assertThat(previsoes).hasSize(10);
        assertThat(previsoes.get(0).quantidadePrevista()).isEqualByComparingTo("12");
    }
}