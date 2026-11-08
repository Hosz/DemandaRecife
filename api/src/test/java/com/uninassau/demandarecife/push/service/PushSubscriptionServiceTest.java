package com.uninassau.demandarecife.push.service;

import com.uninassau.demandarecife.push.entity.PushSubscription;
import com.uninassau.demandarecife.push.repository.PushSubscriptionRepository;
import com.uninassau.demandarecife.push.dto.SubscribeRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PushSubscriptionServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID USER = UUID.randomUUID();

    @Mock
    PushSubscriptionRepository repository;
    @InjectMocks
    PushSubscriptionService service;

    private SubscribeRequest req(String endpoint, String p256dh, String auth) {
        return new SubscribeRequest(endpoint, new SubscribeRequest.Keys(p256dh, auth));
    }

    @Test
    void novoEndpointCriaAssinatura() {
        when(repository.findByEndpoint("https://push/abc")).thenReturn(Optional.empty());

        service.subscribe(TENANT, USER, req("https://push/abc", "chave", "segredo"));

        var captor = ArgumentCaptor.forClass(PushSubscription.class);
        verify(repository).save(captor.capture());
        var s = captor.getValue();
        assertThat(s.getTenantId()).isEqualTo(TENANT);
        assertThat(s.getUserId()).isEqualTo(USER);
        assertThat(s.getEndpoint()).isEqualTo("https://push/abc");
        assertThat(s.getP256dh()).isEqualTo("chave");
        assertThat(s.getAuth()).isEqualTo("segredo");
    }

    @Test
    void mesmoEndpointAtualizaSemDuplicar() {
        var existente = new PushSubscription();
        existente.setEndpoint("https://push/abc");
        existente.setP256dh("antiga");
        existente.setAuth("antigo");
        when(repository.findByEndpoint("https://push/abc")).thenReturn(Optional.of(existente));

        service.subscribe(TENANT, USER, req("https://push/abc", "nova", "novo"));

        var captor = ArgumentCaptor.forClass(PushSubscription.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue()).isSameAs(existente);
        assertThat(existente.getP256dh()).isEqualTo("nova");
        assertThat(existente.getTenantId()).isEqualTo(TENANT);
    }

    @Test
    void cancelarRemovePeloEndpointEPeloNegocio() {
        service.unsubscribe(TENANT, "https://push/abc");

        verify(repository).deleteByEndpointAndTenantId("https://push/abc", TENANT);
    }
}