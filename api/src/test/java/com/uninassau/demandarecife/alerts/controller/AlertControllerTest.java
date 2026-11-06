package com.uninassau.demandarecife.alerts.controller;

import com.uninassau.demandarecife.alerts.dto.AlertResponse;
import com.uninassau.demandarecife.alerts.service.AlertService;
import com.uninassau.demandarecife.shared.exception.ApiExceptionHandler;
import com.uninassau.demandarecife.shared.exception.ResourceNotFoundException;
import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AlertControllerTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock AlertService service;
    @Mock CurrentTenant currentTenant;
    @InjectMocks AlertController controller;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
        lenient().when(currentTenant.id()).thenReturn(TENANT);
    }

    @Test
    void getListaAlertasSemExporTenant() throws Exception {
        var resp = new AlertResponse(UUID.randomUUID(), null, "ESTOQUE_BAIXO", "Estoque baixo",
                "Pão abaixo do mínimo", "MEDIA", "ATIVO", null, LocalDateTime.now(), null, null);
        when(service.listar(TENANT, "ATIVO", false)).thenReturn(List.of(resp));

        mvc.perform(get("/api/alerts?status=ATIVO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tipo").value("ESTOQUE_BAIXO"))
                .andExpect(jsonPath("$[0].tenantId").doesNotExist());
    }

    @Test
    void getCountRetornaAtivos() throws Exception {
        when(service.contarAtivos(TENANT)).thenReturn(3L);

        mvc.perform(get("/api/alerts/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ativos").value(3));
    }

    @Test
    void patchReadRetorna204() throws Exception {
        UUID id = UUID.randomUUID();

        mvc.perform(patch("/api/alerts/" + id + "/read"))
                .andExpect(status().isNoContent());

        verify(service).marcarComoLido(TENANT, id);
    }

    @Test
    void patchResolveRetorna204() throws Exception {
        UUID id = UUID.randomUUID();

        mvc.perform(patch("/api/alerts/" + id + "/resolve"))
                .andExpect(status().isNoContent());

        verify(service).resolver(TENANT, id);
    }

    @Test
    void alertaInexistenteRetorna404ComMensagem() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new ResourceNotFoundException("Alerta não encontrado"))
                .when(service).resolver(TENANT, id);

        mvc.perform(patch("/api/alerts/" + id + "/resolve"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erro").value("Alerta não encontrado"));
    }
}