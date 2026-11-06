package com.uninassau.demandarecife.push.service;

import com.uninassau.demandarecife.alerts.AlertCreatedEvent;
import com.uninassau.demandarecife.push.PushSubscription;
import com.uninassau.demandarecife.push.PushSubscriptionRepository;
import com.uninassau.demandarecife.push.support.PushGateway;
import com.uninassau.demandarecife.push.support.PushGateway.Result;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PushNotificationServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock
    PushSubscriptionRepository repository;
    @Mock
    PushGateway gateway;
    @InjectMocks
    PushNotificationService service;

    private PushSubscription sub(String endpoint) {
        var s = new PushSubscription();
        s.setTenantId(TENANT);
        s.setEndpoint(endpoint);
        return s;
    }

    @Test
    void enviaParaTodasAsAssinaturasDoNegocio() {
        var a = sub("https://push/a");
        var b = sub("https://push/b");
        when(repository.findByTenantId(TENANT)).thenReturn(List.of(a, b));
        when(gateway.send(any(), eq("{}"))).thenReturn(Result.SENT);

        var r = service.enviar(TENANT, "{}");

        assertThat(r.enviados()).isEqualTo(2);
        verify(repository, never()).deleteByEndpoint(any());
    }

    @Test
    void assinaturaExpiradaEhRemovida() {
        var a = sub("https://push/a");
        var b = sub("https://push/b");
        when(repository.findByTenantId(TENANT)).thenReturn(List.of(a, b));
        when(gateway.send(a, "{}")).thenReturn(Result.EXPIRED);
        when(gateway.send(b, "{}")).thenReturn(Result.SENT);

        var r = service.enviar(TENANT, "{}");

        verify(repository).deleteByEndpoint("https://push/a");
        assertThat(r.expirados()).isEqualTo(1);
        assertThat(r.enviados()).isEqualTo(1);
    }

    @Test
    void falhaEmUmaNaoImpedeAsOutras() {
        var a = sub("https://push/a");
        var b = sub("https://push/b");
        when(repository.findByTenantId(TENANT)).thenReturn(List.of(a, b));
        when(gateway.send(a, "{}")).thenReturn(Result.FAILED);
        when(gateway.send(b, "{}")).thenReturn(Result.SENT);

        var r = service.enviar(TENANT, "{}");

        assertThat(r.falhas()).isEqualTo(1);
        assertThat(r.enviados()).isEqualTo(1);
        verify(repository, never()).deleteByEndpoint(any());
    }

    @Test
    void semChavesVapidNaoFazNada() {
        when(repository.findByTenantId(TENANT)).thenReturn(List.of(sub("https://push/a"), sub("https://push/b")));
        when(gateway.send(any(), any())).thenReturn(Result.DISABLED);

        var r = service.enviar(TENANT, "{}");

        assertThat(r).isEqualTo(new PushNotificationService.Resumo(0, 0, 0));
        verify(gateway).send(any(), any());   // parou na primeira
    }

    @Test
    void negocioSemAssinaturasNaoChamaOGateway() {
        when(repository.findByTenantId(TENANT)).thenReturn(List.of());

        service.enviar(TENANT, "{}");

        verifyNoInteractions(gateway);
    }

    @Test
    void alertaCriadoViraNotificacaoComTituloEDescricao() {
        var a = sub("https://push/a");
        when(repository.findByTenantId(TENANT)).thenReturn(List.of(a));
        when(gateway.send(eq(a), any())).thenReturn(Result.SENT);

        service.aoCriarAlerta(new AlertCreatedEvent(TENANT, UUID.randomUUID(),
                "Acabou: Pão", "Compre 10", "ALTA", "RUPTURA_ESTOQUE:x"));

        var captor = ArgumentCaptor.forClass(String.class);
        verify(gateway).send(eq(a), captor.capture());
        assertThat(captor.getValue()).contains("Acabou: Pão").contains("Compre 10").contains("RUPTURA_ESTOQUE:x");
    }
}