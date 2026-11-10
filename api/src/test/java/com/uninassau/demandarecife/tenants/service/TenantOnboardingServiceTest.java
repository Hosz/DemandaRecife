package com.uninassau.demandarecife.tenants.service;

import com.uninassau.demandarecife.auth.entity.TokenAtualizacao;
import com.uninassau.demandarecife.auth.entity.Usuario;
import com.uninassau.demandarecife.auth.repository.TokenAtualizacaoRepository;
import com.uninassau.demandarecife.auth.repository.UsuarioRepository;
import com.uninassau.demandarecife.auth.support.JwtService;
import com.uninassau.demandarecife.tenants.dto.OnboardingRequestDto;
import com.uninassau.demandarecife.tenants.dto.TenantResponseDto;
import com.uninassau.demandarecife.tenants.entity.Tenant;
import com.uninassau.demandarecife.tenants.entity.TenantProfile;
import com.uninassau.demandarecife.tenants.finder.TenantFinder;
import com.uninassau.demandarecife.tenants.repository.TenantProfileRepository;
import com.uninassau.demandarecife.tenants.repository.TenantRepository;
import com.uninassau.demandarecife.tenants.validator.TenantOnboardingValidator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TenantOnboardingServiceTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private TenantProfileRepository tenantProfileRepository;

    @Mock
    private TenantFinder tenantFinder;

    @Mock
    private TenantOnboardingValidator tenantOnboardingValidator;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private TokenAtualizacaoRepository tokenAtualizacaoRepository;

    private TenantOnboardingService tenantOnboardingService;

    @BeforeEach
    void setUp() {
        tenantOnboardingService = new TenantOnboardingService(
                tenantRepository,
                tenantProfileRepository,
                tenantFinder,
                tenantOnboardingValidator,
                usuarioRepository,
                jwtService,
                tokenAtualizacaoRepository
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void onboard_quandoRequestValido_criaTenantEPerfilComSucesso() {
        OnboardingRequestDto request = new OnboardingRequestDto(
                "Marina",
                "Panificadora Central",
                "Padaria / Confeitaria",
                List.of("SEG", "TER", "QUA", "QUI", "SEX"),
                "07:00",
                "19:00",
                new BigDecimal("35.50"),
                "Recife",
                "PE",
                "Derby",
                "12.345.678/0001-90"
        );

        UUID tenantId = UUID.randomUUID();
        UUID profileId = UUID.randomUUID();

        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> {
            Tenant t = invocation.getArgument(0);
            t.setId(tenantId);
            return t;
        });

        when(tenantProfileRepository.save(any(TenantProfile.class))).thenAnswer(invocation -> {
            TenantProfile p = invocation.getArgument(0);
            p.setId(profileId);
            return p;
        });

        TenantResponseDto response = tenantOnboardingService.onboard(request);

        verify(tenantOnboardingValidator).validateOnboarding(request);
        verify(tenantRepository).save(any(Tenant.class));
        verify(tenantProfileRepository).save(any(TenantProfile.class));

        assertThat(response).isNotNull();
        assertThat(response.tenantId()).isEqualTo(tenantId);
        assertThat(response.nome()).isEqualTo("Panificadora Central");
        assertThat(response.nichoAtuacao()).isEqualTo("Padaria / Confeitaria");
        assertThat(response.ticketMedio()).isEqualByComparingTo("35.50");
        assertThat(response.cidade()).isEqualTo("Recife");
        assertThat(response.estado()).isEqualTo("PE");

        assertThat(response.perfil()).isNotNull();
        assertThat(response.perfil().profileId()).isEqualTo(profileId);
        assertThat(response.perfil().responsavelNome()).isEqualTo("Marina");
        assertThat(response.perfil().horarioAbertura()).isEqualTo(LocalTime.of(7, 0));
        assertThat(response.perfil().horarioFechamento()).isEqualTo(LocalTime.of(19, 0));
        assertThat(response.perfil().diasFuncionamento()).containsExactly("SEG", "TER", "QUA", "QUI", "SEX");
        assertThat(response.accessToken()).isNull();
    }

    @Test
    void onboard_quandoNaoInformaBusinessName_usaNomeDoUsuario() {
        OnboardingRequestDto request = new OnboardingRequestDto(
                "Carlos Silva",
                null,
                "Salão de Beleza / Estética",
                List.of("TER", "QUA", "QUI", "SEX", "SAB"),
                "09:00",
                "18:00",
                new BigDecimal("60.00"),
                null,
                null,
                null,
                null
        );

        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> {
            Tenant t = invocation.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        when(tenantProfileRepository.save(any(TenantProfile.class))).thenAnswer(invocation -> {
            TenantProfile p = invocation.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });

        TenantResponseDto response = tenantOnboardingService.onboard(request);

        ArgumentCaptor<Tenant> tenantCaptor = ArgumentCaptor.forClass(Tenant.class);
        verify(tenantRepository).save(tenantCaptor.capture());

        Tenant savedTenant = tenantCaptor.getValue();
        assertThat(savedTenant.getNome()).isEqualTo("Carlos Silva");
        assertThat(savedTenant.getCidade()).isEqualTo("Recife");
        assertThat(savedTenant.getEstado()).isEqualTo("PE");
        assertThat(response.nome()).isEqualTo("Carlos Silva");
    }

    @Test
    void onboard_quandoUsuarioAutenticado_vinculaTenantERetornaNovosTokens() {
        UUID userId = UUID.randomUUID();
        Usuario usuario = Usuario.builder()
                .id(userId)
                .nome("Marina")
                .email("marina@padaria.com")
                .ativo(true)
                .build();

        Jwt jwt = Jwt.withTokenValue("mock-jwt-token")
                .header("alg", "none")
                .subject(userId.toString())
                .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));

        OnboardingRequestDto request = new OnboardingRequestDto(
                "Marina",
                "Padaria Recife",
                "Padaria / Confeitaria",
                List.of("SEG"),
                "08:00",
                "18:00",
                new BigDecimal("50.00"),
                "Recife",
                "PE",
                "Boa Viagem",
                null
        );

        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> {
            Tenant t = invocation.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        when(tenantProfileRepository.save(any(TenantProfile.class))).thenAnswer(invocation -> {
            TenantProfile p = invocation.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });

        when(usuarioRepository.findById(userId)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        when(jwtService.gerarAccessToken(any(Usuario.class))).thenReturn("new-access-token-with-tenant");
        when(jwtService.gerarRefreshToken()).thenReturn("new-refresh-token");
        when(jwtService.calcularExpiracaoRefreshToken()).thenReturn(Instant.now().plusSeconds(3600));
        when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(86400L);

        TenantResponseDto response = tenantOnboardingService.onboard(request);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("new-access-token-with-tenant");
        assertThat(response.refreshToken()).isEqualTo("new-refresh-token");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.expiresIn()).isEqualTo(86400L);

        verify(tokenAtualizacaoRepository).save(any(TokenAtualizacao.class));
        verify(usuarioRepository).save(usuario);
        assertThat(usuario.getTenant()).isNotNull();
    }

    @Test
    void updateTenant_quandoAtualizaTicketMedio_salvaComSucesso() {
        UUID tenantId = UUID.randomUUID();
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setNome("Mercado");
        tenant.setTicketMedio(null);

        TenantProfile profile = new TenantProfile();
        profile.setId(UUID.randomUUID());
        tenant.setPerfil(profile);

        when(tenantFinder.findById(tenantId)).thenReturn(tenant);
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(inv -> inv.getArgument(0));
        when(tenantProfileRepository.save(any(TenantProfile.class))).thenAnswer(inv -> inv.getArgument(0));

        OnboardingRequestDto request = new OnboardingRequestDto(
                "Marina",
                "Mercado Atualizado",
                "Mercado / Mercearia",
                List.of("SEG", "TER"),
                "08:00",
                "19:00",
                new BigDecimal("60.00"),
                "Recife",
                "PE",
                "Boa Viagem",
                null
        );

        TenantResponseDto response = tenantOnboardingService.updateTenant(tenantId, request);

        assertThat(response).isNotNull();
        assertThat(response.ticketMedio()).isEqualByComparingTo("60.00");
        assertThat(response.nome()).isEqualTo("Mercado Atualizado");
    }
}
