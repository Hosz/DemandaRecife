package com.uninassau.demandarecife.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uninassau.demandarecife.auth.dto.request.LoginRequest;
import com.uninassau.demandarecife.auth.dto.request.RefreshTokenRequest;
import com.uninassau.demandarecife.auth.dto.request.RegistroRequest;
import com.uninassau.demandarecife.auth.dto.response.LoginResponse;
import com.uninassau.demandarecife.auth.dto.response.RegistroResponse;
import com.uninassau.demandarecife.auth.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void registrar_quandoDadosValidos_retornaStatusCreated() throws Exception {
        RegistroRequest request = new RegistroRequest("Marina", "marina@padaria.com", "senha123");
        UUID userId = UUID.randomUUID();
        RegistroResponse response = new RegistroResponse(userId, "Marina", "marina@padaria.com");

        when(authService.registrar(any(RegistroRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(userId.toString()))
                .andExpect(jsonPath("$.nome").value("Marina"))
                .andExpect(jsonPath("$.email").value("marina@padaria.com"));

        verify(authService).registrar(any(RegistroRequest.class));
    }

    @Test
    void login_quandoCredenciaisCorretas_retornaOkETokens() throws Exception {
        LoginRequest request = new LoginRequest("marina@padaria.com", "senha123");
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        LoginResponse response = new LoginResponse(
                userId, tenantId, "Marina", "marina@padaria.com",
                "access_token_jwt", "refresh_token_uuid", "Bearer", 86400L
        );

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userId.toString()))
                .andExpect(jsonPath("$.accessToken").value("access_token_jwt"))
                .andExpect(jsonPath("$.refreshToken").value("refresh_token_uuid"));

        verify(authService).login(any(LoginRequest.class));
    }

    @Test
    void refresh_quandoTokenInformado_retornaNovosTokens() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest("refresh_token_uuid");
        UUID userId = UUID.randomUUID();
        LoginResponse response = new LoginResponse(
                userId, null, "Marina", "marina@padaria.com",
                "novo_access", "novo_refresh", "Bearer", 86400L
        );

        when(authService.refresh(any(RefreshTokenRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("novo_access"))
                .andExpect(jsonPath("$.refreshToken").value("novo_refresh"));

        verify(authService).refresh(any(RefreshTokenRequest.class));
    }
}
