package com.uninassau.demandarecife.tenants.dto;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record TenantProfileDto(
        UUID profileId,
        String responsavelNome,
        LocalTime horarioAbertura,
        LocalTime horarioFechamento,
        List<String> diasFuncionamento
) {}
