package com.uninassau.demandarecife.shared.tenant;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CurrentTenant {

    public UUID id() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            String tenantIdStr = jwtAuth.getToken().getClaimAsString("tenantId");
            if (tenantIdStr != null && !tenantIdStr.isBlank()) {
                try {
                    return UUID.fromString(tenantIdStr);
                } catch (IllegalArgumentException ignored) {
                }
            }
        }
        // Fallback de compatibilidade para requisições/testes não autenticados
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }
}
