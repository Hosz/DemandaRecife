package com.uninassau.demandarecife.tenants.finder;

import com.uninassau.demandarecife.shared.exception.ResourceNotFoundException;
import com.uninassau.demandarecife.tenants.entity.Tenant;
import com.uninassau.demandarecife.tenants.entity.TenantProfile;
import com.uninassau.demandarecife.tenants.repository.TenantProfileRepository;
import com.uninassau.demandarecife.tenants.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class TenantFinder {

    private final TenantRepository tenantRepository;
    private final TenantProfileRepository tenantProfileRepository;

    public Tenant findById(UUID tenantId) {
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant não encontrado com ID: " + tenantId));
    }

    public TenantProfile findProfileByTenantId(UUID tenantId) {
        return tenantProfileRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado para o tenant ID: " + tenantId));
    }
}
