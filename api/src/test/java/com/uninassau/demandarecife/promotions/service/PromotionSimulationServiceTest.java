package com.uninassau.demandarecife.promotions.service;

import com.uninassau.demandarecife.products.entity.Product;
import com.uninassau.demandarecife.products.repository.ProductRepository;
import com.uninassau.demandarecife.promotions.dto.PromotionSimulation.Status;
import com.uninassau.demandarecife.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class PromotionSimulationServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock ProductRepository productRepository;

    PromotionSimulationService service;
    Product produto;

    @BeforeEach
    void setUp() {
        service = new PromotionSimulationService(productRepository);
        produto = produto("4.00", "10.00");
    }

    private Product produto(String custo, String preco) {
        var p = new Product();
        p.setId(UUID.randomUUID());
        p.setTenantId(TENANT);
        p.setNome("Bolo");
        p.setCustoUnidade(custo == null ? null : new BigDecimal(custo));
        p.setPrecoVenda(new BigDecimal(preco));
        lenient().when(productRepository.findByIdAndTenantId(p.getId(), TENANT)).thenReturn(Optional.of(p));
        return p;
    }

    private BigDecimal bd(String v) {
        return new BigDecimal(v);
    }

    @Test
    void semParametrosDevolveSoOsLimites() {
        var r = service.simulate(TENANT, produto.getId(), null, null);

        assertThat(r.margemAtualPercentual()).isEqualByComparingTo("60.00");
        assertThat(r.descontoMaximoPercentual()).isEqualByComparingTo("60.00");
        assertThat(r.precoMinimo()).isEqualByComparingTo("4.00");
        assertThat(r.novoPreco()).isNull();
        assertThat(r.status()).isNull();
    }

    @Test
    void descontoComLucroEAprovado() {
        var r = service.simulate(TENANT, produto.getId(), bd("20"), null);

        assertThat(r.novoPreco()).isEqualByComparingTo("8.00");
        assertThat(r.novaMargemPercentual()).isEqualByComparingTo("50.00");
        assertThat(r.lucroUnitario()).isEqualByComparingTo("4.00");
        assertThat(r.descontoAplicadoPercentual()).isEqualByComparingTo("20.00");
        assertThat(r.status()).isEqualTo(Status.APROVADO);
    }

    @Test
    void descontoQueIgualaOPrecoAoCustoJaEhRisco() {
        var r = service.simulate(TENANT, produto.getId(), bd("60"), null);

        assertThat(r.novoPreco()).isEqualByComparingTo("4.00");
        assertThat(r.novaMargemPercentual()).isEqualByComparingTo("0.00");
        assertThat(r.status()).isEqualTo(Status.RISCO_FINANCEIRO);
    }

    @Test
    void descontoAbaixoDoCustoDaMargemNegativa() {
        var r = service.simulate(TENANT, produto.getId(), bd("70"), null);

        assertThat(r.novoPreco()).isEqualByComparingTo("3.00");
        assertThat(r.novaMargemPercentual()).isEqualByComparingTo("-33.33");
        assertThat(r.lucroUnitario()).isEqualByComparingTo("-1.00");
        assertThat(r.status()).isEqualTo(Status.RISCO_FINANCEIRO);
    }

    @Test
    void precoAlvoCalculaODescontoEquivalente() {
        var r = service.simulate(TENANT, produto.getId(), null, bd("7.50"));

        assertThat(r.descontoAplicadoPercentual()).isEqualByComparingTo("25.00");
        assertThat(r.novaMargemPercentual()).isEqualByComparingTo("46.67");
        assertThat(r.status()).isEqualTo(Status.APROVADO);
    }

    @Test
    void produtoJaVendidoAbaixoDoCustoNaoTemDescontoPossivel() {
        var caro = produto("12.00", "10.00");

        var r = service.simulate(TENANT, caro.getId(), null, null);

        assertThat(r.descontoMaximoPercentual()).isEqualByComparingTo("0.00");
        assertThat(r.margemAtualPercentual()).isEqualByComparingTo("-20.00");
    }

    @Test
    void recusaDescontoEPrecoAlvoJuntos() {
        assertThatThrownBy(() -> service.simulate(TENANT, produto.getId(), bd("10"), bd("5")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("não os dois");
    }

    @Test
    void recusaDescontoForaDoIntervalo() {
        assertThatThrownBy(() -> service.simulate(TENANT, produto.getId(), bd("100"), null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.simulate(TENANT, produto.getId(), bd("-5"), null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void recusaPrecoAlvoInvalido() {
        assertThatThrownBy(() -> service.simulate(TENANT, produto.getId(), null, bd("0")))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.simulate(TENANT, produto.getId(), null, bd("10.01")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void produtoSemCustoCadastradoERecusado() {
        var semCusto = produto(null, "10.00");

        assertThatThrownBy(() -> service.simulate(TENANT, semCusto.getId(), bd("10"), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("sem custo");
    }

    @Test
    void produtoDeOutroTenantNaoEhEncontrado() {
        assertThatThrownBy(() -> service.simulate(TENANT, UUID.randomUUID(), bd("10"), null))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}