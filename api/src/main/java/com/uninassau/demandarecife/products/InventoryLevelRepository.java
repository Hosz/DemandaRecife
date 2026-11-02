
package com.uninassau.demandarecife.products;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InventoryLevelRepository
        extends JpaRepository<InventoryLevel, UUID> {

    List<InventoryLevel> findByTenantId(UUID tenantId);

    List<InventoryLevel> findByTenantIdAndQuantidadeAtualLessThanEqual(
            UUID tenantId,
            Integer limite
    );
}
