package com.uninassau.demandarecife.push.service;

import com.uninassau.demandarecife.push.PushSubscription;
import com.uninassau.demandarecife.push.PushSubscriptionRepository;
import com.uninassau.demandarecife.push.dto.SubscribeRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PushSubscriptionService {

    private final PushSubscriptionRepository repository;

    /** Mesmo endpoint = mesmo aparelho: atualiza em vez de duplicar (ex.: trocou de conta). */
    @Transactional
    public void subscribe(UUID tenantId, UUID userId, SubscribeRequest req) {
        var sub = repository.findByEndpoint(req.endpoint()).orElseGet(PushSubscription::new);
        sub.setTenantId(tenantId);
        sub.setUserId(userId);
        sub.setEndpoint(req.endpoint());
        sub.setP256dh(req.keys().p256dh());
        sub.setAuth(req.keys().auth());
        repository.save(sub);
    }

    @Transactional
    public void unsubscribe(UUID tenantId, String endpoint) {
        repository.deleteByEndpointAndTenantId(endpoint, tenantId);
    }
}