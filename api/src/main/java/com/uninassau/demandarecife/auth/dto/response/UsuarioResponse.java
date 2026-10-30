package com.uninassau.demandarecife.auth.dto.response;

import java.util.UUID;

public record UsuarioResponse(
        UUID userId,
        UUID tenantId,
        String nome,
        String email,
        boolean ativo
) {}
