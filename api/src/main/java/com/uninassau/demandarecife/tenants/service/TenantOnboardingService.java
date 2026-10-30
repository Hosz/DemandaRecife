package com.uninassau.demandarecife.tenants.service;

import com.uninassau.demandarecife.tenants.dto.OnboardingRequestDto;
import com.uninassau.demandarecife.tenants.dto.TenantResponseDto;
import com.uninassau.demandarecife.tenants.entity.Tenant;
import com.uninassau.demandarecife.tenants.entity.TenantProfile;
import com.uninassau.demandarecife.tenants.finder.TenantFinder;
import com.uninassau.demandarecife.tenants.mapper.TenantMapper;
import com.uninassau.demandarecife.tenants.mapper.TenantProfileMapper;
import com.uninassau.demandarecife.tenants.repository.TenantProfileRepository;
import com.uninassau.demandarecife.tenants.repository.TenantRepository;
import com.uninassau.demandarecife.tenants.validator.TenantOnboardingValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantOnboardingService {

    private final TenantRepository tenantRepository;
    private final TenantProfileRepository tenantProfileRepository;
    private final TenantFinder tenantFinder;
    private final TenantOnboardingValidator tenantOnboardingValidator;

    @Transactional
    public TenantResponseDto onboard(OnboardingRequestDto request) {
        tenantOnboardingValidator.validateOnboarding(request);

        log.info("Iniciando onboarding de tenant para o responsável '{}' no nicho '{}'...", request.userName(), request.niche());

        Tenant tenant = TenantMapper.toEntity(request);
        Tenant savedTenant = tenantRepository.save(tenant);

        TenantProfile profile = TenantProfileMapper.toEntity(savedTenant, request);
        TenantProfile savedProfile = tenantProfileRepository.save(profile);
        savedTenant.setPerfil(savedProfile);

        // TODO: Associar/criar registro inicial em 'users' quando o módulo completo de Auth/OAuth2 for integrado.

        log.info("Tenant criado com sucesso com ID: {} e perfil associado com ID: {}", savedTenant.getId(), savedProfile.getId());
        return TenantMapper.toResponseDto(savedTenant, savedProfile);
    }

    @Transactional(readOnly = true)
    public TenantResponseDto getById(UUID tenantId) {
        Tenant tenant = tenantFinder.findById(tenantId);
        TenantProfile profile = tenant.getPerfil();
        return TenantMapper.toResponseDto(tenant, profile);
    }
}
