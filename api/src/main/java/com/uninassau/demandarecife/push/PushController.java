package com.uninassau.demandarecife.push;

import com.uninassau.demandarecife.push.dto.PublicKeyResponse;
import com.uninassau.demandarecife.push.dto.SubscribeRequest;
import com.uninassau.demandarecife.push.dto.UnsubscribeRequest;
import com.uninassau.demandarecife.push.service.PushSubscriptionService;
import com.uninassau.demandarecife.push.support.PushProperties;
import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushController {

    private final PushSubscriptionService service;
    private final PushProperties properties;
    private final CurrentTenant currentTenant;

    // O front usa esta chave em pushManager.subscribe()
    @GetMapping("/public-key")
    public PublicKeyResponse publicKey() {
        if (!properties.configured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Notificações push não configuradas.");
        }
        return new PublicKeyResponse(properties.getPublicKey());
    }

    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(@Valid @RequestBody SubscribeRequest req,
                                          @AuthenticationPrincipal Jwt jwt) {
        service.subscribe(currentTenant.id(), UUID.fromString(jwt.getSubject()), req);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/subscribe")
    public ResponseEntity<Void> unsubscribe(@Valid @RequestBody UnsubscribeRequest req) {
        service.unsubscribe(currentTenant.id(), req.endpoint());
        return ResponseEntity.noContent().build();
    }
}