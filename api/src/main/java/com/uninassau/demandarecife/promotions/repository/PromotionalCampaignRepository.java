package com.uninassau.demandarecife.promotions.repository;

import com.uninassau.demandarecife.promotions.entity.PromotionalCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface PromotionalCampaignRepository extends JpaRepository<PromotionalCampaign, UUID> {
    List<PromotionalCampaign> findByTenantIdOrderByCriadoEmDesc(UUID tenantId);

    @Modifying
    @Transactional
    @Query("DELETE FROM PromotionalCampaign c WHERE c.tenantId = :tenantId AND c.id = :id")
    void deleteByTenantIdAndId(@Param("tenantId") UUID tenantId, @Param("id") UUID id);

    @Modifying
    @Transactional
    @Query("DELETE FROM PromotionalCampaign c WHERE c.tenantId = :tenantId AND c.productId = :productId")
    void deleteByTenantIdAndProductId(@Param("tenantId") UUID tenantId, @Param("productId") UUID productId);
}
