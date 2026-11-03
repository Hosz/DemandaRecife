package com.uninassau.demandarecife.tenants.service;

import com.uninassau.demandarecife.auth.repository.UsuarioRepository;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
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
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public TenantResponseDto onboard(OnboardingRequestDto request) {
        tenantOnboardingValidator.validateOnboarding(request);

        log.info("Iniciando onboarding de tenant para o responsável '{}' no nicho '{}'...", request.userName(), request.niche());

        Tenant tenant = TenantMapper.toEntity(request);
        Tenant savedTenant = tenantRepository.save(tenant);

        TenantProfile profile = TenantProfileMapper.toEntity(savedTenant, request);
        TenantProfile savedProfile = tenantProfileRepository.save(profile);
        savedTenant.setPerfil(savedProfile);

        vincularUsuarioAutenticado(savedTenant);

        log.info("Tenant criado com sucesso com ID: {} e perfil associado com ID: {}", savedTenant.getId(), savedProfile.getId());
        return TenantMapper.toResponseDto(savedTenant, savedProfile);
    }

    @Transactional(readOnly = true)
    public TenantResponseDto getById(UUID tenantId) {
        Tenant tenant = tenantFinder.findById(tenantId);
        TenantProfile profile = tenant.getPerfil();
        return TenantMapper.toResponseDto(tenant, profile);
    }

    private void vincularUsuarioAutenticado(Tenant tenant) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth instanceof JwtAuthenticationToken jwtAuth) {
                String sub = jwtAuth.getToken().getSubject();
                if (sub != null && !sub.isBlank()) {
                    UUID userId = UUID.fromString(sub);
                    usuarioRepository.findById(userId).ifPresent(usuario -> {
                        usuario.setTenant(tenant);
                        usuarioRepository.save(usuario);
                        log.info("Tenant '{}' (ID: {}) vinculado com sucesso ao usuário '{}' (ID: {})",
                                tenant.getNome(), tenant.getId(), usuario.getNome(), usuario.getId());
                    });
                }
            }
        } catch (Exception ex) {
            log.warn("Não foi possível vincular o tenant ao usuário a partir do token: {}", ex.getMessage());
        }
    }
}
