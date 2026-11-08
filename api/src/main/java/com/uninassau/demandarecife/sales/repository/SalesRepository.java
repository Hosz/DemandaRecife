package com.uninassau.demandarecife.sales.repository;

import com.uninassau.demandarecife.sales.entity.SaleTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface SalesRepository extends JpaRepository<SaleTransaction, UUID> {
    List<SaleTransaction> findByTenantIdAndDataHoraVendaBetween(
            UUID tenantId, LocalDateTime inicio, LocalDateTime fim);
}
