package com.uninassau.demandarecife.auth.dto.response;

import java.util.UUID;

public record LoginResponse(
        UUID userId,
        UUID tenantId,
        String nome,
        String email,
        String accessToken,
        String refreshToken,
        String tokenType,
        Long expiresIn
) {}
