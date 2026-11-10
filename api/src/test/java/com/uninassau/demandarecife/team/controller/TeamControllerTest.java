package com.uninassau.demandarecife.team.controller;

import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import com.uninassau.demandarecife.team.dto.CreateMemberRequest;
import com.uninassau.demandarecife.team.dto.TeamMemberDto;
import com.uninassau.demandarecife.team.service.TeamService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeamControllerTest {

    @Mock
    private TeamService teamService;

    @Mock
    private CurrentTenant currentTenant;

    @InjectMocks
    private TeamController controller;

    @Test
    @DisplayName("Deve listar membros da equipe")
    void deveListarMembros() {
        UUID tenantId = UUID.randomUUID();
        when(currentTenant.id()).thenReturn(tenantId);
        when(teamService.listMembers(tenantId)).thenReturn(List.of(
                new TeamMemberDto(UUID.randomUUID(), "Carlos Silva", "Padeiro")
        ));

        var result = controller.listMembers();

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().nome()).isEqualTo("Carlos Silva");
    }

    @Test
    @DisplayName("Deve cadastrar novo membro da equipe")
    void deveCadastrarMembro() {
        UUID tenantId = UUID.randomUUID();
        when(currentTenant.id()).thenReturn(tenantId);
        CreateMemberRequest req = new CreateMemberRequest("Ana", "Atendente");
        when(teamService.addMember(tenantId, req)).thenReturn(new TeamMemberDto(UUID.randomUUID(), "Ana", "Atendente"));

        var result = controller.addMember(req);

        assertThat(result.nome()).isEqualTo("Ana");
        verify(teamService).addMember(tenantId, req);
    }
}
