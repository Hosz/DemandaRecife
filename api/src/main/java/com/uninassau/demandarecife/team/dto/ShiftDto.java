package com.uninassau.demandarecife.team.dto;

import java.util.List;
import java.util.UUID;

public record ShiftDto(
        UUID id,
        String diaSemana,
        String horario,
        String horarioInicio,
        String horarioFim,
        String demanda,
        String tipoDemanda,
        boolean vagaPendente,
        String funcao,
        String intervalo,
        String observacoes,
        List<String> funcionarios
) {
    public ShiftDto(UUID id, String diaSemana, String horario, String horarioInicio, String horarioFim,
                    String demanda, String tipoDemanda, boolean vagaPendente, List<String> funcionarios) {
        this(id, diaSemana, horario, horarioInicio, horarioFim, demanda, tipoDemanda, vagaPendente, "Geral", null, null, funcionarios);
    }
}
