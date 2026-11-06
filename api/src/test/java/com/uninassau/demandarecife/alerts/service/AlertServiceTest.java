package com.uninassau.demandarecife.alerts.service;

import com.uninassau.demandarecife.alerts.entity.OperationalAlert;
import com.uninassau.demandarecife.alerts.repository.OperationalAlertRepository;
import com.uninassau.demandarecife.alerts.enums.AlertStatus;
import com.uninassau.demandarecife.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AlertServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock OperationalAlertRepository repository;
    @InjectMocks AlertService service;

    private OperationalAlert alerta() {
        var a = new OperationalAlert();
        a.setId(UUID.randomUUID());
        a.setTenantId(TENANT);
        a.setTitulo("Estoque baixo");
        a.setDescricao("Pão Francês está abaixo do mínimo");
        return a;
    }

    // ---------- listar ----------

    @Test
    void listarSemFiltroTrazTodosDoTenant() {
        when(repository.findByTenantIdOrderByCriadoEmDesc(TENANT)).thenReturn(List.of(alerta(), alerta()));

        assertThat(service.listar(TENANT, null, false)).hasSize(2);
    }

    @Test
    void listarPorStatusConverteParaMaiusculo() {
        when(repository.findByTenantIdAndStatusOrderByCriadoEmDesc(TENANT, AlertStatus.valueOf("ATIVO"))).thenReturn(List.of(alerta()));

        assertThat(service.listar(TENANT, "ativo", false)).hasSize(1);
    }

    @Test
    void apenasNaoLidosTemPrioridadeSobreOStatus() {
        when(repository.findByTenantIdAndLidoEmIsNullOrderByCriadoEmDesc(TENANT)).thenReturn(List.of(alerta()));

        service.listar(TENANT, "ATIVO", true);

        verify(repository, never()).findByTenantIdAndStatusOrderByCriadoEmDesc(any(), any());
    }

    @Test
    void listaLimitadaA100() {
        List<OperationalAlert> muitos = new ArrayList<>();
        for (int i = 0; i < 150; i++) muitos.add(alerta());
        when(repository.findByTenantIdOrderByCriadoEmDesc(TENANT)).thenReturn(muitos);

        assertThat(service.listar(TENANT, null, false)).hasSize(100);
    }

    // ---------- contar ----------

    @Test
    void contarAtivosUsaStatusAtivo() {
        when(repository.countByTenantIdAndStatus(TENANT, AlertStatus.valueOf("ATIVO"))).thenReturn(3L);

        assertThat(service.contarAtivos(TENANT)).isEqualTo(3);
    }

    // ---------- ler / resolver ----------

    @Test
    void marcarComoLidoAtualizaOAlertaDoTenant() {
        var a = alerta();
        when(repository.findByIdAndTenantId(a.getId(), TENANT)).thenReturn(Optional.of(a));

        service.marcarComoLido(TENANT, a.getId());

        verify(repository).marcarComoLido(any(), any(), any(LocalDateTime.class));
    }

    @Test
    void marcarComoLidoDeAlertaInexistenteLanca404() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndTenantId(id, TENANT)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.marcarComoLido(TENANT, id))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(repository, never()).marcarComoLido(any(), any(), any());
    }

    @Test
    void resolverAtualizaOAlertaDoTenant() {
        var a = alerta();
        when(repository.findByIdAndTenantId(a.getId(), TENANT)).thenReturn(Optional.of(a));

        service.resolver(TENANT, a.getId());

        verify(repository).resolverAlerta(any(), any(), any(LocalDateTime.class));
    }

    @Test
    void resolverAlertaDeOutroTenantLanca404() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndTenantId(id, TENANT)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.resolver(TENANT, id))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(repository, never()).resolverAlerta(any(), any(), any());
    }
}