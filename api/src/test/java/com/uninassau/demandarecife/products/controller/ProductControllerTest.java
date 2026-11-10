package com.uninassau.demandarecife.products.controller;

import com.uninassau.demandarecife.forecast.benchmark.MarketBenchmark;
import com.uninassau.demandarecife.forecast.benchmark.MarketBenchmarkRepository;
import com.uninassau.demandarecife.inventory.repository.InventoryRepository;
import com.uninassau.demandarecife.products.entity.Product;
import com.uninassau.demandarecife.products.repository.ProductRepository;
import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import com.uninassau.demandarecife.tenants.entity.Tenant;
import com.uninassau.demandarecife.tenants.repository.TenantRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private MarketBenchmarkRepository benchmarkRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private CurrentTenant currentTenant;

    @InjectMocks
    private ProductController controller;

    @Test
    @DisplayName("Deve listar produtos do tenant autenticado")
    void deveListarProdutosDoTenant() {
        UUID tenantId = UUID.randomUUID();
        when(currentTenant.id()).thenReturn(tenantId);

        Product p = new Product();
        p.setId(UUID.randomUUID());
        p.setTenantId(tenantId);
        p.setNome("Pão Francês");
        p.setSku("PAO-001");
        p.setPrecoVenda(new BigDecimal("15.00"));
        p.setCustoUnidade(new BigDecimal("9.00"));

        when(productRepository.findByTenantId(tenantId)).thenReturn(List.of(p));

        var result = controller.listProducts();

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().nome()).isEqualTo("Pão Francês");
        assertThat(result.getFirst().sku()).isEqualTo("PAO-001");
    }

    @Test
    @DisplayName("Deve retornar sugestões de benchmark para o nicho do tenant")
    void deveRetornarSugestoesDeBenchmark() {
        UUID tenantId = UUID.randomUUID();
        when(currentTenant.id()).thenReturn(tenantId);

        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setNichoAtuacao("Padaria / Confeitaria");
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

        var b1 = new MarketBenchmark("padaria", "pao frances", "Pão Francês Tradicional", "Panificação",
                new BigDecimal("0.85"), new BigDecimal("320.00"), "UN", true);
        when(benchmarkRepository.findByNichoAndDestaqueCatalogoTrue("padaria")).thenReturn(List.of(b1));

        var result = controller.getBenchmarkSuggestions(null);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().nomeSugerido()).isEqualTo("Pão Francês Tradicional");
        assertThat(result.getFirst().mediaDiaria()).isEqualByComparingTo("320.00");
    }

    @Test
    @DisplayName("Deve retornar sugestões para hamburgueria quando passado explicitamente")
    void deveRetornarSugestoesParaHamburgueria() {
        var bBurger = new MarketBenchmark("hamburgueria", "hamburguer artesanal", "Hambúrguer Artesanal / Smash", "Lanches",
                new BigDecimal("28.00"), new BigDecimal("55.00"), "UN", true);
        when(benchmarkRepository.findByNichoAndDestaqueCatalogoTrue("hamburgueria")).thenReturn(List.of(bBurger));

        var result = controller.getBenchmarkSuggestions("Hamburgueria, Lanchonete & Pastelaria");

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().nomeSugerido()).isEqualTo("Hambúrguer Artesanal / Smash");
        assertThat(result.getFirst().mediaDiaria()).isEqualByComparingTo("55.00");
    }

    @Test
    @DisplayName("Deve retornar sugestões para confeitaria quando passado explicitamente")
    void deveRetornarSugestoesParaConfeitaria() {
        var bDoce = new MarketBenchmark("confeitaria", "bolo decorado", "Bolo Confeitado (Fatia)", "Confeitaria",
                new BigDecimal("8.50"), new BigDecimal("25.00"), "UN", true);
        when(benchmarkRepository.findByNichoAndDestaqueCatalogoTrue("confeitaria")).thenReturn(List.of(bDoce));

        var result = controller.getBenchmarkSuggestions("Confeitaria, Doceria & Cafeteria");

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().nomeSugerido()).isEqualTo("Bolo Confeitado (Fatia)");
        assertThat(result.getFirst().mediaDiaria()).isEqualByComparingTo("25.00");
    }

    @Test
    @DisplayName("Deve adicionar starter kit de produtos ao catálogo do tenant")
    void deveAdicionarStarterKitAoCatalogo() {
        UUID tenantId = UUID.randomUUID();
        when(currentTenant.id()).thenReturn(tenantId);

        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setNichoAtuacao("Padaria / Confeitaria");
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

        Product saved = new Product();
        saved.setId(UUID.randomUUID());
        saved.setTenantId(tenantId);
        saved.setNome("Pão Francês Tradicional");
        saved.setPrecoVenda(new BigDecimal("0.85"));
        saved.setCustoUnidade(new BigDecimal("0.38"));
        saved.setSku("PAOFRA-123");

        var b1 = new MarketBenchmark("padaria", "pao frances", "Pão Francês Tradicional", "Panificação",
                new BigDecimal("0.85"), new BigDecimal("320.00"), "UN", true);
        when(benchmarkRepository.findByNichoAndDestaqueCatalogoTrue("padaria")).thenReturn(List.of(b1));

        when(productRepository.findByTenantId(tenantId)).thenReturn(List.of()).thenReturn(List.of(saved));
        when(productRepository.save(any(Product.class))).thenReturn(saved);

        var response = controller.addStarterKit(null, null);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().getFirst().nome()).isEqualTo("Pão Francês Tradicional");
    }
}
