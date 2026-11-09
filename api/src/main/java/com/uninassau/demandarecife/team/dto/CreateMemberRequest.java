package com.uninassau.demandarecife.team.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateMemberRequest(
        @NotBlank(message = "O nome do colaborador é obrigatório")
        String nome,
        String cargo
) {}
