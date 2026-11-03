package com.uninassau.demandarecife.auth.dto.response;

import java.util.UUID;

public record RegistroResponse(
        UUID userId,
        String nome,
        String email
) {}
