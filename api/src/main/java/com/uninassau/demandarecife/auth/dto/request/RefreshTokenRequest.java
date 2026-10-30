package com.uninassau.demandarecife.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(
        @NotBlank(message = "O token de atualização é obrigatório.")
        String refreshToken
) {}
