package com.uninassau.demandarecife.inventory.service;

import com.uninassau.demandarecife.inventory.entity.InventoryLevel;
import com.uninassau.demandarecife.inventory.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository repository;

    /** produto -> data/hora da última contagem do estoque. */
    @Transactional(readOnly = true)
    public Map<UUID, LocalDateTime> contagens(UUID tenantId) {
        return repository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(InventoryLevel::getProductId, InventoryLevel::getContadoEm));
    }

    /** Venda avulsa: baixa o estoque se a venda for posterior à última contagem. */
    @Transactional
    public void baixarVendaAvulsa(UUID tenantId, UUID productId, int quantidade, LocalDateTime dataVenda) {
        repository.findByTenantIdAndProductId(tenantId, productId)
                .filter(n -> dataVenda.isAfter(n.getContadoEm()))
                .ifPresent(n -> repository.baixar(tenantId, productId, quantidade));
    }

    /** Importação: uma baixa por produto, com o total já somado. */
    @Transactional
    public void baixar(UUID tenantId, Map<UUID, Integer> saidas) {
        saidas.forEach((productId, quantidade) -> repository.baixar(tenantId, productId, quantidade));
    }
}