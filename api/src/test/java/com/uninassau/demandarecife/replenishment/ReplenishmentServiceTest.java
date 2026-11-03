package com.uninassau.demandarecife.replenishment;

import com.uninassau.demandarecife.forecast.DemandForecastService;
import com.uninassau.demandarecife.forecast.dto.ForecastResult;
import com.uninassau.demandarecife.forecast.dto.ForecastResult.Metodo;
import com.uninassau.demandarecife.inventory.InventoryLevel;
import com.uninassau.demandarecife.inventory.InventoryRepository;
import com.uninassau.demandarecife.products.Product;
import com.uninassau.demandarecife.products.ProductRepository;
import com.uninassau.demandarecife.replenishment.dto.ReplenishmentSuggestion;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class ReplenishmentServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock InventoryRepository inventoryRepository;
    @Mock ProductRepository productRepository;
    @Mock DemandForecastService forecastService;

    ReplenishmentService service;
    Product pao;

    @BeforeEach
    void setUp() {
        service = new ReplenishmentService(inventoryRepository, productRepository, forecastService);
        pao = new Product();
        pao.setId(UUID.randomUUID());
        pao.setTenantId(TENANT);
        pao.setNome("Pão Francês");
        lenient().when(productRepository.findByTenantId(TENANT)).thenReturn(List.of(pao));
    }

    private InventoryLevel nivel(int atual, int minimo, int prazo) {
        var n = new InventoryLevel();
        n.setTenantId(TENANT);
        n.setProductId(pao.getId());
        n.setQuantidadeAtual(atual);
        n.setEstoqueMinimo(minimo);
        n.setTempoReposicaoDias(prazo);
        return n;
    }

    private List<ForecastResult> dias(int quantidade, double valor, Metodo metodo) {
        List<ForecastResult> lista = new ArrayList<>();
        for (int i = 0; i < quantidade; i++) {
            lista.add(new ForecastResult(pao.getId(), LocalDate.of(2025, 10, 29).plusDays(i),
                    BigDecimal.valueOf(valor), metodo));
        }
        return lista;
    }

    private void cenario(InventoryLevel nivel, List<ForecastResult> previsao) {
        lenient().when(inventoryRepository.findByTenantId(TENANT)).thenReturn(List.of(nivel));
        lenient().when(forecastService.forecastPeriod(eq(TENANT), any(LocalDate.class), anyInt()))
                .thenReturn(Map.of(pao.getId(), previsao));
    }

    @Test
    void produtoSemHistoricoUsaOPadraoEMandaComprarSeEstiverAbaixo() {
        cenario(nivel(3, 5, 1), dias(8, 0, Metodo.SEM_DADOS));

        var s = service.suggestions(TENANT).get(0);

        assertThat(s.metodo()).isEqualTo(ReplenishmentSuggestion.Metodo.PADRAO);
        assertThat(s.estoqueMinimo()).isEqualTo(5);
        assertThat(s.estoqueMaximo()).isEqualTo(10);
        assertThat(s.comprarAgora()).isTrue();
        assertThat(s.quantidadeSugerida()).isEqualTo(7);
    }

    @Test
    void produtoSemHistoricoComEstoqueSuficienteNaoCompra() {
        cenario(nivel(8, 5, 1), dias(8, 0, Metodo.SEM_DADOS));

        var s = service.suggestions(TENANT).get(0);

        assertThat(s.comprarAgora()).isFalse();
        assertThat(s.quantidadeSugerida()).isZero();
    }

    @Test
    void calculaMinimoEMaximoPelaPrevisao() {
        // 10/dia, prazo 2 dias, horizonte 9 dias: prazo=20, margem=max(5, 10)=10, mínimo=30, máximo=90
        cenario(nivel(20, 5, 2), dias(9, 10, Metodo.HISTORICO));

        var s = service.suggestions(TENANT).get(0);

        assertThat(s.metodo()).isEqualTo(ReplenishmentSuggestion.Metodo.PREVISAO);
        assertThat(s.estoqueMinimo()).isEqualTo(30);
        assertThat(s.estoqueMaximo()).isEqualTo(90);
        assertThat(s.comprarAgora()).isTrue();
        assertThat(s.quantidadeSugerida()).isEqualTo(70);
    }

    @Test
    void estoqueAcimaDoMinimoNaoGeraCompra() {
        cenario(nivel(50, 5, 2), dias(9, 10, Metodo.HISTORICO));

        var s = service.suggestions(TENANT).get(0);

        assertThat(s.comprarAgora()).isFalse();
        assertThat(s.quantidadeSugerida()).isZero();
    }

    @Test
    void estoqueIgualAoMinimoJaGeraCompra() {
        cenario(nivel(30, 5, 2), dias(9, 10, Metodo.HISTORICO));

        assertThat(service.suggestions(TENANT).get(0).comprarAgora()).isTrue();
    }

    @Test
    void minimoCadastradoMaiorQueOCalculadoViraPiso() {
        cenario(nivel(50, 100, 2), dias(9, 10, Metodo.HISTORICO));

        var s = service.suggestions(TENANT).get(0);

        assertThat(s.estoqueMinimo()).isEqualTo(100);
        assertThat(s.estoqueMaximo()).isEqualTo(101);     // nunca igual ao mínimo
        assertThat(s.comprarAgora()).isTrue();
        assertThat(s.quantidadeSugerida()).isEqualTo(51);
    }

    @Test
    void sodiasDoPrazoEntramNoMinimo() {
        // prazo 1 dia: dia 1 = 10, os outros 7 dias = 20 -> prazo=10, média=150/8=18,75, margem=18,75
        List<ForecastResult> previsao = new ArrayList<>(dias(1, 10, Metodo.HISTORICO));
        previsao.addAll(dias(7, 20, Metodo.HISTORICO));
        cenario(nivel(5, 1, 1), previsao);

        var s = service.suggestions(TENANT).get(0);

        assertThat(s.estoqueMinimo()).isEqualTo(29);      // ceil(10 + 18,75)
        assertThat(s.estoqueMaximo()).isEqualTo(150);
    }

    @Test
    void produtoSemRegistroDeEstoqueEIgnorado() {
        lenient().when(inventoryRepository.findByTenantId(TENANT)).thenReturn(List.of());

        assertThat(service.suggestions(TENANT)).isEmpty();
    }
}