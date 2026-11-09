package com.uninassau.demandarecife.sales.repository;

import com.uninassau.demandarecife.sales.entity.SaleTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface SalesRepository extends JpaRepository<SaleTransaction, UUID> {
    List<SaleTransaction> findByTenantIdAndDataHoraVendaBetween(
            UUID tenantId, LocalDateTime inicio, LocalDateTime fim);

    @Query(value = """
            SELECT CAST(EXTRACT(HOUR FROM s.data_hora_venda) AS INTEGER) AS hora, COUNT(s.id) AS total
            FROM sales_transactions s
            WHERE s.tenant_id = :tenantId
            GROUP BY EXTRACT(HOUR FROM s.data_hora_venda)
            ORDER BY hora
            """, nativeQuery = true)
    List<HourlySalesCount> countSalesByHour(@Param("tenantId") UUID tenantId);
}
