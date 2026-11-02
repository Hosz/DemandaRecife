package com.uninassau.demandarecife.shared.tenant;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class CurrentTenantTest {

    private CurrentTenant currentTenant;

    @BeforeEach
    void setUp() {
        currentTenant = new CurrentTenant();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void id_quandoNaoAutenticado_retornaUuidPadrao() {
        SecurityContextHolder.clearContext();
        UUID id = currentTenant.id();
        assertThat(id).isEqualTo(UUID.fromString("00000000-0000-0000-0000-000000000001"));
    }

    @Test
    void id_quandoAutenticadoComTenantIdClaim_retornaTenantDoToken() {
        UUID expectedTenantId = UUID.randomUUID();

        Jwt jwt = new Jwt(
                "token_val",
                Instant.now(),
                Instant.now().plusSeconds(3600),
                Map.of("alg", "HS256"),
                Map.of("sub", UUID.randomUUID().toString(), "tenantId", expectedTenantId.toString())
        );

        JwtAuthenticationToken authToken = new JwtAuthenticationToken(jwt);
        SecurityContextHolder.getContext().setAuthentication(authToken);

        UUID resolvedTenantId = currentTenant.id();
        assertThat(resolvedTenantId).isEqualTo(expectedTenantId);
    }
}
