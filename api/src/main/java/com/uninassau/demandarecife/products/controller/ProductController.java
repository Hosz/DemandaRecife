package com.uninassau.demandarecife.products.controller;

import com.uninassau.demandarecife.alerts.repository.OperationalAlertRepository;
import com.uninassau.demandarecife.forecast.benchmark.DatabaseBenchmarkProvider;
import com.uninassau.demandarecife.forecast.benchmark.MarketBenchmark;
import com.uninassau.demandarecife.forecast.benchmark.MarketBenchmarkRepository;
import com.uninassau.demandarecife.inventory.entity.InventoryLevel;
import com.uninassau.demandarecife.inventory.repository.InventoryRepository;
import com.uninassau.demandarecife.products.dto.BenchmarkSuggestionDto;
import com.uninassau.demandarecife.products.dto.ProductDto;
import com.uninassau.demandarecife.products.dto.StarterKitStatusDto;
import com.uninassau.demandarecife.products.entity.Product;
import com.uninassau.demandarecife.products.repository.ProductRepository;
import com.uninassau.demandarecife.promotions.repository.PromotionalCampaignRepository;
import com.uninassau.demandarecife.sales.repository.SalesRepository;
import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import com.uninassau.demandarecife.tenants.entity.Tenant;
import com.uninassau.demandarecife.tenants.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductRepository productRepository;
    private final TenantRepository tenantRepository;
    private final MarketBenchmarkRepository benchmarkRepository;
    private final InventoryRepository inventoryRepository;
    private final SalesRepository salesRepository;
    private final OperationalAlertRepository operationalAlertRepository;
    private final PromotionalCampaignRepository promotionalCampaignRepository;
    private final CurrentTenant currentTenant;

    @GetMapping
    public List<ProductDto> listProducts() {
        return productRepository.findByTenantId(currentTenant.id()).stream()
                .map(p -> new ProductDto(
                        p.getId(),
                        p.getNome(),
                        p.getSku(),
                        p.getPrecoVenda(),
                        p.getCustoUnidade()
                ))
                .toList();
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID id) {
        UUID tenantId = currentTenant.id();
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));

        // Remove transações de vendas do produto para respeitar a FK
        salesRepository.deleteByTenantIdAndProductId(tenantId, id);

        // Remove nível de inventário
        inventoryRepository.deleteByTenantIdAndProductId(tenantId, id);

        // Remove alertas operacionais associados ao produto
        operationalAlertRepository.deleteByTenantIdAndProductId(tenantId, id);

        // Remove campanhas promocionais atreladas
        promotionalCampaignRepository.deleteByTenantIdAndProductId(tenantId, id);

        // Deleta o produto
        productRepository.delete(product);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/benchmarks/suggestions")
    public List<BenchmarkSuggestionDto> getBenchmarkSuggestions(@RequestParam(required = false) String nicho) {
        UUID tenantId = null;
        try {
            tenantId = currentTenant.id();
        } catch (Exception ignored) {}

        String nichoEfetivo = "geral";
        if (nicho != null && !nicho.isBlank()) {
            nichoEfetivo = nicho;
        } else if (tenantId != null) {
            nichoEfetivo = tenantRepository.findById(tenantId)
                    .map(Tenant::getNichoAtuacao)
                    .orElse("geral");
        }

        String nichoNormalizado = DatabaseBenchmarkProvider.normalizarNicho(nichoEfetivo);
        List<MarketBenchmark> suggestions = benchmarkRepository.findByNichoAndDestaqueCatalogoTrue(nichoNormalizado);
        if (suggestions.isEmpty()) {
            suggestions = benchmarkRepository.findByNicho(nichoNormalizado);
        }

        Set<String> existingNames = Set.of();
        if (tenantId != null) {
            try {
                existingNames = productRepository.findByTenantId(tenantId).stream()
                        .map(p -> p.getNome().trim().toLowerCase())
                        .collect(Collectors.toSet());
            } catch (Exception ignored) {}
        }

        final Set<String> nomesSet = existingNames;
        return suggestions.stream()
                .map(b -> new BenchmarkSuggestionDto(
                        b.getId(),
                        b.getNomeSugerido(),
                        b.getCategoria(),
                        b.getPrecoSugerido(),
                        b.getMediaDiaria(),
                        b.getUnidade(),
                        nomesSet.contains(b.getNomeSugerido().trim().toLowerCase())
                ))
                .toList();
    }

    @GetMapping("/starter-kit/status")
    public ResponseEntity<StarterKitStatusDto> getStarterKitStatus(@RequestParam(required = false) String nicho) {
        List<BenchmarkSuggestionDto> suggestions = getBenchmarkSuggestions(nicho);
        int total = suggestions.size();
        int alreadyAdded = (int) suggestions.stream().filter(BenchmarkSuggestionDto::jaAdicionado).count();
        int pending = total - alreadyAdded;
        boolean applied = total > 0 && pending == 0;
        return ResponseEntity.ok(new StarterKitStatusDto(applied, total, alreadyAdded, pending));
    }

    @PostMapping("/starter-kit")
    @Transactional
    public ResponseEntity<List<ProductDto>> addStarterKit(
            @RequestBody(required = false) List<UUID> benchmarkIds,
            @RequestParam(required = false) String nicho) {
        UUID tenantId = currentTenant.id();
        List<Product> existingProducts = productRepository.findByTenantId(tenantId);
        Set<String> existingNames = existingProducts.stream()
                .map(p -> p.getNome().trim().toLowerCase())
                .collect(Collectors.toSet());

        List<MarketBenchmark> toAdd;
        if (benchmarkIds != null && !benchmarkIds.isEmpty()) {
            toAdd = benchmarkRepository.findAllById(benchmarkIds);
        } else {
            String nichoEfetivo = (nicho != null && !nicho.isBlank())
                    ? nicho
                    : tenantRepository.findById(tenantId)
                            .map(Tenant::getNichoAtuacao)
                            .orElse("geral");
            String nichoNormalizado = DatabaseBenchmarkProvider.normalizarNicho(nichoEfetivo);
            toAdd = benchmarkRepository.findByNichoAndDestaqueCatalogoTrue(nichoNormalizado);
            if (toAdd.isEmpty()) {
                toAdd = benchmarkRepository.findByNicho(nichoNormalizado);
            }
        }

        List<Product> newlyCreated = new ArrayList<>();
        for (MarketBenchmark b : toAdd) {
            if (!existingNames.contains(b.getNomeSugerido().trim().toLowerCase())) {
                Product p = new Product();
                p.setTenantId(tenantId);
                p.setNome(b.getNomeSugerido());
                p.setPrecoVenda(b.getPrecoSugerido() != null ? b.getPrecoSugerido() : BigDecimal.ZERO);
                p.setCustoUnidade(b.getPrecoSugerido() != null
                        ? b.getPrecoSugerido().multiply(new BigDecimal("0.45")).setScale(2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO);
                p.setSku(generateSku(b.getNomeSugerido()));
                Product saved = productRepository.save(p);
                newlyCreated.add(saved);
                existingNames.add(b.getNomeSugerido().trim().toLowerCase());

                int estoqueMinimo = 5;
                if (b.getMediaDiaria() != null && b.getMediaDiaria().compareTo(BigDecimal.ZERO) > 0) {
                    estoqueMinimo = Math.max(5, b.getMediaDiaria().multiply(BigDecimal.valueOf(2)).intValue());
                }
                InventoryLevel level = new InventoryLevel();
                level.setTenantId(tenantId);
                level.setProductId(saved.getId());
                level.setQuantidadeAtual(0);
                level.setEstoqueMinimo(estoqueMinimo);
                level.setTempoReposicaoDias(2);
                inventoryRepository.save(level);
            }
        }

        // Garante que nenhum produto existente do tenant fique sem nível de estoque
        for (Product existing : productRepository.findByTenantId(tenantId)) {
            if (inventoryRepository.findByTenantIdAndProductId(tenantId, existing.getId()).isEmpty()) {
                InventoryLevel level = new InventoryLevel();
                level.setTenantId(tenantId);
                level.setProductId(existing.getId());
                level.setQuantidadeAtual(0);
                level.setEstoqueMinimo(5);
                level.setTempoReposicaoDias(2);
                inventoryRepository.save(level);
            }
        }

        List<ProductDto> result = productRepository.findByTenantId(tenantId).stream()
                .map(p -> new ProductDto(p.getId(), p.getNome(), p.getSku(), p.getPrecoVenda(), p.getCustoUnidade()))
                .toList();

        return ResponseEntity.ok(result);
    }

    private String generateSku(String nome) {
        String base = nome.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (base.length() > 6) {
            base = base.substring(0, 6);
        }
        return base + "-" + (int)(Math.random() * 900 + 100);
    }
}
