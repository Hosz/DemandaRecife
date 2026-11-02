package com.uninassau.demandarecife.tenants.repository;

import com.uninassau.demandarecife.tenants.entity.TenantProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantProfileRepository extends JpaRepository<TenantProfile, UUID> {

    Optional<TenantProfile> findByTenantId(UUID tenantId);
}
