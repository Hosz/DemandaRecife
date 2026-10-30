package com.uninassau.demandarecife.tenants.service;

import com.uninassau.demandarecife.auth.repository.UsuarioRepository;
import com.uninassau.demandarecife.tenants.dto.OnboardingRequestDto;
import com.uninassau.demandarecife.tenants.dto.TenantResponseDto;
import com.uninassau.demandarecife.tenants.entity.Tenant;
import com.uninassau.demandarecife.tenants.entity.TenantProfile;
import com.uninassau.demandarecife.tenants.finder.TenantFinder;
import com.uninassau.demandarecife.tenants.repository.TenantProfileRepository;
import com.uninassau.demandarecife.tenants.repository.TenantRepository;
import com.uninassau.demandarecife.tenants.validator.TenantOnboardingValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
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

    private TenantOnboardingService tenantOnboardingService;

    @BeforeEach
    void setUp() {
        tenantOnboardingService = new TenantOnboardingService(
                tenantRepository,
                tenantProfileRepository,
                tenantFinder,
                tenantOnboardingValidator,
                usuarioRepository
        );
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
}
