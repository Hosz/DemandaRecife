package com.uninassau.demandarecife.team.dto;

import java.util.UUID;

public record TeamMemberDto(
        UUID id,
        String nome,
        String cargo
) {}
