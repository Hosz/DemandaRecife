package com.uninassau.demandarecife.tenants.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uninassau.demandarecife.tenants.dto.OnboardingRequestDto;
import com.uninassau.demandarecife.tenants.dto.TenantProfileDto;
import com.uninassau.demandarecife.tenants.dto.TenantResponseDto;
import com.uninassau.demandarecife.tenants.service.TenantOnboardingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TenantOnboardingControllerTest {

    @Mock
    private TenantOnboardingService tenantOnboardingService;

    @InjectMocks
    private TenantOnboardingController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void onboard_viaAuthOnboard_retornaCreatedEPerfilAssociado() throws Exception {
        UUID tenantId = UUID.randomUUID();
        UUID profileId = UUID.randomUUID();

        OnboardingRequestDto request = new OnboardingRequestDto(
                "Marina",
                "Padaria Delícia",
                "Padaria / Confeitaria",
                List.of("SEG", "TER", "QUA", "QUI", "SEX"),
                "08:00",
                "18:00",
                new BigDecimal("45.00"),
                "Recife",
                "PE",
                "Boa Viagem",
                null
        );

        TenantProfileDto profileDto = new TenantProfileDto(
                profileId,
                "Marina",
                LocalTime.of(8, 0),
                LocalTime.of(18, 0),
                List.of("SEG", "TER", "QUA", "QUI", "SEX")
        );

        TenantResponseDto responseDto = new TenantResponseDto(
                tenantId,
                "Padaria Delícia",
                "Padaria / Confeitaria",
                new BigDecimal("45.00"),
                "Recife",
                "PE",
                "Boa Viagem",
                profileDto,
                Instant.now()
        );

        when(tenantOnboardingService.onboard(any(OnboardingRequestDto.class))).thenReturn(responseDto);

        mockMvc.perform(post("/api/auth/onboard")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tenantId").value(tenantId.toString()))
                .andExpect(jsonPath("$.nome").value("Padaria Delícia"))
                .andExpect(jsonPath("$.nichoAtuacao").value("Padaria / Confeitaria"))
                .andExpect(jsonPath("$.ticketMedio").value(45.00))
                .andExpect(jsonPath("$.perfil.responsavelNome").value("Marina"))
                .andExpect(jsonPath("$.perfil.horarioAbertura").value("08:00:00"))
                .andExpect(jsonPath("$.perfil.horarioFechamento").value("18:00:00"));

        verify(tenantOnboardingService).onboard(any(OnboardingRequestDto.class));
    }

    @Test
    void onboard_viaTenantsOnboarding_retornaCreated() throws Exception {
        UUID tenantId = UUID.randomUUID();
        OnboardingRequestDto request = new OnboardingRequestDto(
                "Marina",
                null,
                "Mercado / Mercearia",
                List.of("SEG"),
                "08:00",
                "18:00",
                new BigDecimal("20.00"),
                null, null, null, null
        );

        TenantResponseDto responseDto = new TenantResponseDto(
                tenantId,
                "Marina",
                "Mercado / Mercearia",
                new BigDecimal("20.00"),
                "Recife",
                "PE",
                null,
                null,
                Instant.now()
        );

        when(tenantOnboardingService.onboard(any(OnboardingRequestDto.class))).thenReturn(responseDto);

        mockMvc.perform(post("/api/tenants/onboarding")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tenantId").value(tenantId.toString()))
                .andExpect(jsonPath("$.nome").value("Marina"));
    }

    @Test
    void getById_retornaTenantEPerfil() throws Exception {
        UUID tenantId = UUID.randomUUID();
        TenantResponseDto responseDto = new TenantResponseDto(
                tenantId,
                "Minha Loja",
                "Loja de Roupas / Vestuário",
                new BigDecimal("150.00"),
                "Recife",
                "PE",
                "Espinheiro",
                null,
                Instant.now()
        );

        when(tenantOnboardingService.getById(tenantId)).thenReturn(responseDto);

        mockMvc.perform(get("/api/tenants/" + tenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tenantId").value(tenantId.toString()))
                .andExpect(jsonPath("$.nome").value("Minha Loja"));

        verify(tenantOnboardingService).getById(tenantId);
    }
}
