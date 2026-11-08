package com.uninassau.demandarecife.inventory.repository;

import com.uninassau.demandarecife.inventory.entity.InventoryLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryRepository extends JpaRepository<InventoryLevel, UUID> {

    List<InventoryLevel> findByTenantId(UUID tenantId);

    Optional<InventoryLevel> findByTenantIdAndProductId(UUID tenantId, UUID productId);

    // Subtração feita pelo próprio banco: seguro se duas vendas chegarem ao mesmo tempo.
    // GREATEST evita estoque negativo (dono vendeu algo que não tinha lançado).
    @Modifying
    @Query(value = """
            UPDATE inventory_levels
               SET quantidade_atual = GREATEST(quantidade_atual - :qtd, 0),
                   atualizado_em = CURRENT_TIMESTAMP
             WHERE tenant_id = :tenantId AND product_id = :productId
            """, nativeQuery = true)
    int baixar(@Param("tenantId") UUID tenantId,
               @Param("productId") UUID productId,
               @Param("qtd") int quantidade);

    // Quais negócios têm estoque cadastrado (o job só varre esses)
    @Query("SELECT DISTINCT i.tenantId FROM InventoryLevel i")
    List<UUID> findTenantIdsWithInventory();
}