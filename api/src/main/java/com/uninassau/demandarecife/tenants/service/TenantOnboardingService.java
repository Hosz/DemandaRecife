package com.uninassau.demandarecife.tenants.service;

import com.uninassau.demandarecife.auth.entity.TokenAtualizacao;
import com.uninassau.demandarecife.auth.entity.Usuario;
import com.uninassau.demandarecife.auth.mapper.AuthMapper;
import com.uninassau.demandarecife.auth.repository.TokenAtualizacaoRepository;
import com.uninassau.demandarecife.auth.repository.UsuarioRepository;
import com.uninassau.demandarecife.auth.support.JwtService;
import com.uninassau.demandarecife.shared.exception.BadRequestException;
import com.uninassau.demandarecife.tenants.dto.OnboardingRequestDto;
import com.uninassau.demandarecife.tenants.dto.TenantResponseDto;
import com.uninassau.demandarecife.tenants.dto.UpdateTenantRequestDto;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
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
    private final JwtService jwtService;
    private final TokenAtualizacaoRepository tokenAtualizacaoRepository;

    @Transactional
    public TenantResponseDto onboard(OnboardingRequestDto request) {
        tenantOnboardingValidator.validateOnboarding(request);

        log.info("Iniciando onboarding de tenant para o responsável '{}' no nicho '{}'...", request.userName(), request.niche());

        Tenant tenant = TenantMapper.toEntity(request);
        Tenant savedTenant = tenantRepository.save(tenant);

        TenantProfile profile = TenantProfileMapper.toEntity(savedTenant, request);
        TenantProfile savedProfile = tenantProfileRepository.save(profile);
        savedTenant.setPerfil(savedProfile);

        Usuario usuarioVinculado = vincularUsuarioAutenticado(savedTenant);

        log.info("Tenant criado com sucesso com ID: {} e perfil associado com ID: {}", savedTenant.getId(), savedProfile.getId());

        if (usuarioVinculado != null && jwtService != null && tokenAtualizacaoRepository != null) {
            String accessToken = jwtService.gerarAccessToken(usuarioVinculado);
            String refreshToken = jwtService.gerarRefreshToken();
            Instant expiraEm = jwtService.calcularExpiracaoRefreshToken();

            TokenAtualizacao tokenEntity = AuthMapper.toTokenAtualizacao(usuarioVinculado, refreshToken, expiraEm);
            tokenAtualizacaoRepository.save(tokenEntity);

            return TenantMapper.toResponseDto(
                    savedTenant,
                    savedProfile,
                    accessToken,
                    refreshToken,
                    "Bearer",
                    jwtService.getAccessTokenExpirationSeconds()
            );
        }

        return TenantMapper.toResponseDto(savedTenant, savedProfile);
    }

    @Transactional(readOnly = true)
    public TenantResponseDto getById(UUID tenantId) {
        Tenant tenant = tenantFinder.findById(tenantId);
        TenantProfile profile = tenant.getPerfil();
        return TenantMapper.toResponseDto(tenant, profile);
    }

    @Transactional
    public TenantResponseDto updateTenant(UUID tenantId, UpdateTenantRequestDto request) {
        Tenant tenant = tenantFinder.findById(tenantId);

        if (request.businessName() != null && !request.businessName().isBlank()) {
            tenant.setNome(request.businessName().trim());
        }
        if (request.niche() != null && !request.niche().isBlank()) {
            tenant.setNichoAtuacao(request.niche().trim());
        }
        if (request.averageTicket() != null) {
            if (request.averageTicket().compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("O ticket médio não pode ser negativo.");
            }
            tenant.setTicketMedio(request.averageTicket());
        }
        if (request.bairro() != null && !request.bairro().isBlank()) {
            tenant.setBairro(request.bairro().trim());
        }
        if (request.cidade() != null && !request.cidade().isBlank()) {
            tenant.setCidade(request.cidade().trim());
        }
        if (request.estado() != null && !request.estado().isBlank()) {
            tenant.setEstado(request.estado().trim());
        }
        if (request.cnpj() != null && !request.cnpj().isBlank()) {
            tenant.setCnpj(request.cnpj().trim());
        }

        Tenant savedTenant = tenantRepository.save(tenant);

        TenantProfile profile = savedTenant.getPerfil();
        if (profile == null) {
            profile = tenantProfileRepository.findByTenantId(tenantId).orElse(null);
        }

        if (profile != null) {
            if (request.userName() != null && !request.userName().isBlank()) {
                profile.setResponsavelNome(request.userName().trim());
            }
            if (request.openingTime() != null && !request.openingTime().isBlank()) {
                try {
                    profile.setHorarioAbertura(LocalTime.parse(request.openingTime().trim()));
                } catch (Exception ignored) {}
            }
            if (request.closingTime() != null && !request.closingTime().isBlank()) {
                try {
                    profile.setHorarioFechamento(LocalTime.parse(request.closingTime().trim()));
                } catch (Exception ignored) {}
            }
            if (request.businessDays() != null && !request.businessDays().isEmpty()) {
                profile.setDiasFuncionamento(String.join(",", request.businessDays()));
            }
            if (request.usarBenchmarksColdStart() != null) {
                profile.setUsarBenchmarksColdStart(request.usarBenchmarksColdStart());
            }
            profile = tenantProfileRepository.save(profile);
            savedTenant.setPerfil(profile);
        }

        log.info("Tenant '{}' (ID: {}) atualizado com sucesso", savedTenant.getNome(), savedTenant.getId());
        return TenantMapper.toResponseDto(savedTenant, profile);
    }

    @Transactional
    public TenantResponseDto updateTenant(UUID tenantId, OnboardingRequestDto request) {
        Tenant tenant = tenantFinder.findById(tenantId);

        if (request.businessName() != null && !request.businessName().isBlank()) {
            tenant.setNome(request.businessName().trim());
        }
        if (request.niche() != null && !request.niche().isBlank()) {
            tenant.setNichoAtuacao(request.niche().trim());
        }
        if (request.averageTicket() != null) {
            if (request.averageTicket().compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("O ticket médio não pode ser negativo.");
            }
            tenant.setTicketMedio(request.averageTicket());
        }
        if (request.bairro() != null && !request.bairro().isBlank()) {
            tenant.setBairro(request.bairro().trim());
        }
        if (request.cidade() != null && !request.cidade().isBlank()) {
            tenant.setCidade(request.cidade().trim());
        }
        if (request.estado() != null && !request.estado().isBlank()) {
            tenant.setEstado(request.estado().trim());
        }
        if (request.cnpj() != null && !request.cnpj().isBlank()) {
            tenant.setCnpj(request.cnpj().trim());
        }

        Tenant savedTenant = tenantRepository.save(tenant);

        TenantProfile profile = savedTenant.getPerfil();
        if (profile == null) {
            profile = tenantProfileRepository.findByTenantId(tenantId).orElse(null);
        }

        if (profile != null) {
            if (request.userName() != null && !request.userName().isBlank()) {
                profile.setResponsavelNome(request.userName().trim());
            }
            if (request.openingTime() != null && !request.openingTime().isBlank()) {
                try {
                    profile.setHorarioAbertura(LocalTime.parse(request.openingTime().trim()));
                } catch (Exception ignored) {}
            }
            if (request.closingTime() != null && !request.closingTime().isBlank()) {
                try {
                    profile.setHorarioFechamento(LocalTime.parse(request.closingTime().trim()));
                } catch (Exception ignored) {}
            }
            if (request.businessDays() != null && !request.businessDays().isEmpty()) {
                profile.setDiasFuncionamento(String.join(",", request.businessDays()));
            }
            if (request.usarBenchmarksColdStart() != null) {
                profile.setUsarBenchmarksColdStart(request.usarBenchmarksColdStart());
            }
            profile = tenantProfileRepository.save(profile);
            savedTenant.setPerfil(profile);
        }

        log.info("Tenant '{}' (ID: {}) atualizado com sucesso", savedTenant.getNome(), savedTenant.getId());
        return TenantMapper.toResponseDto(savedTenant, profile);
    }

    private Usuario vincularUsuarioAutenticado(Tenant tenant) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth instanceof JwtAuthenticationToken jwtAuth) {
                String sub = jwtAuth.getToken().getSubject();
                if (sub != null && !sub.isBlank()) {
                    UUID userId = UUID.fromString(sub);
                    return usuarioRepository.findById(userId).map(usuario -> {
                        usuario.setTenant(tenant);
                        Usuario salvo = usuarioRepository.save(usuario);
                        log.info("Tenant '{}' (ID: {}) vinculado com sucesso ao usuário '{}' (ID: {})",
                                tenant.getNome(), tenant.getId(), usuario.getNome(), usuario.getId());
                        return salvo;
                    }).orElse(null);
                }
            }
        } catch (Exception ex) {
            log.warn("Não foi possível vincular o tenant ao usuário a partir do token: {}", ex.getMessage());
        }
        return null;
    }
}
