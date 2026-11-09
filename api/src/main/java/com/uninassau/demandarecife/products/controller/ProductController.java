package com.uninassau.demandarecife.products.controller;

import com.uninassau.demandarecife.forecast.benchmark.DatabaseBenchmarkProvider;
import com.uninassau.demandarecife.forecast.benchmark.MarketBenchmark;
import com.uninassau.demandarecife.forecast.benchmark.MarketBenchmarkRepository;
import com.uninassau.demandarecife.inventory.entity.InventoryLevel;
import com.uninassau.demandarecife.inventory.repository.InventoryRepository;
import com.uninassau.demandarecife.products.dto.BenchmarkSuggestionDto;
import com.uninassau.demandarecife.products.dto.ProductDto;
import com.uninassau.demandarecife.products.entity.Product;
import com.uninassau.demandarecife.products.repository.ProductRepository;
import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import com.uninassau.demandarecife.tenants.entity.Tenant;
import com.uninassau.demandarecife.tenants.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/benchmarks/suggestions")
    public List<BenchmarkSuggestionDto> getBenchmarkSuggestions(@RequestParam(required = false) String nicho) {
        UUID tenantId = currentTenant.id();
        String nichoEfetivo = (nicho != null && !nicho.isBlank())
                ? nicho
                : tenantRepository.findById(tenantId)
                        .map(Tenant::getNichoAtuacao)
                        .orElse("geral");

        String nichoNormalizado = DatabaseBenchmarkProvider.normalizarNicho(nichoEfetivo);
        List<MarketBenchmark> suggestions = benchmarkRepository.findByNichoAndDestaqueCatalogoTrue(nichoNormalizado);
        if (suggestions.isEmpty()) {
            suggestions = benchmarkRepository.findByNicho(nichoNormalizado);
        }

        return suggestions.stream()
                .map(b -> new BenchmarkSuggestionDto(
                        b.getId(),
                        b.getNomeSugerido(),
                        b.getCategoria(),
                        b.getPrecoSugerido(),
                        b.getMediaDiaria(),
                        b.getUnidade()
                ))
                .toList();
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
