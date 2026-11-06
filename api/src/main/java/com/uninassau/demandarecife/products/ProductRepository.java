package com.uninassau.demandarecife.products;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByTenantId(UUID tenantId);
    boolean existsByIdAndTenantId(UUID id, UUID tenantId);
    Optional<Product> findByIdAndTenantId(UUID id, UUID tenantId);
}
