package com.uninassau.demandarecife.tenants.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TenantResponseDto(
        UUID tenantId,
        String nome,
        String nichoAtuacao,
        BigDecimal ticketMedio,
        String cidade,
        String estado,
        String bairro,
        TenantProfileDto perfil,
        Instant criadoEm
) {}
