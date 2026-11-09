package com.uninassau.demandarecife.team.dto;

import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record SaveShiftRequest(
        UUID id,
        String diaSemana,
        String horarioInicio,
        String horarioFim,
        String demanda,
        String tipoDemanda,
        boolean vagaPendente,
        @Size(max = 100, message = "A função deve ter no máximo 100 caracteres")
        String funcao,
        @Size(max = 50, message = "O intervalo deve ter no máximo 50 caracteres")
        String intervalo,
        @Size(max = 255, message = "As observações devem ter no máximo 255 caracteres")
        String observacoes,
        List<String> funcionarios
) {}
