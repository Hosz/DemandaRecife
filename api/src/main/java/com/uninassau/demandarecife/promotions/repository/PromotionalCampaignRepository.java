package com.uninassau.demandarecife.promotions.repository;

import com.uninassau.demandarecife.promotions.entity.PromotionalCampaign;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PromotionalCampaignRepository extends JpaRepository<PromotionalCampaign, UUID> {
    List<PromotionalCampaign> findByTenantIdOrderByCriadoEmDesc(UUID tenantId);
    void deleteByTenantIdAndId(UUID tenantId, UUID id);
}
