package com.uninassau.demandarecife.team.service;

import com.uninassau.demandarecife.team.dto.CreateMemberRequest;
import com.uninassau.demandarecife.team.dto.SaveShiftRequest;
import com.uninassau.demandarecife.team.dto.ShiftDto;
import com.uninassau.demandarecife.team.dto.TeamMemberDto;
import com.uninassau.demandarecife.team.entity.Shift;
import com.uninassau.demandarecife.team.entity.ShiftAssignment;
import com.uninassau.demandarecife.team.entity.TeamMember;
import com.uninassau.demandarecife.team.repository.ShiftRepository;
import com.uninassau.demandarecife.team.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamMemberRepository memberRepository;
    private final ShiftRepository shiftRepository;

    @Transactional(readOnly = true)
    public List<TeamMemberDto> listMembers(UUID tenantId) {
        return memberRepository.findByTenantIdOrderByNomeAsc(tenantId).stream()
                .map(m -> new TeamMemberDto(m.getId(), m.getNome(), m.getCargo()))
                .toList();
    }

    @Transactional
    public TeamMemberDto addMember(UUID tenantId, CreateMemberRequest req) {
        String nome = req.nome().trim();
        TeamMember member = new TeamMember(tenantId, nome, req.cargo() != null ? req.cargo().trim() : "Colaborador");
        TeamMember saved = memberRepository.save(member);
        return new TeamMemberDto(saved.getId(), saved.getNome(), saved.getCargo());
    }

    @Transactional
    public void deleteMember(UUID tenantId, UUID memberId) {
        memberRepository.findById(memberId).ifPresent(m -> {
            if (m.getTenantId().equals(tenantId)) {
                memberRepository.delete(m);
            }
        });
    }

    @Transactional(readOnly = true)
    public List<ShiftDto> listShifts(UUID tenantId, String diaSemana) {
        List<Shift> shifts = shiftRepository.findByTenantIdAndDiaSemanaOrderByHorarioInicioAsc(tenantId, diaSemana);
        return shifts.stream().map(this::toDto).toList();
    }

    @Transactional
    public ShiftDto saveShift(UUID tenantId, SaveShiftRequest req) {
        Shift shift;
        if (req.id() != null) {
            shift = shiftRepository.findById(req.id())
                    .filter(s -> s.getTenantId().equals(tenantId))
                    .orElseGet(() -> {
                        Shift novo = new Shift();
                        novo.setTenantId(tenantId);
                        return novo;
                    });
        } else {
            shift = new Shift();
            shift.setTenantId(tenantId);
        }

        shift.setDiaSemana(req.diaSemana() != null ? req.diaSemana() : "Seg");
        shift.setHorarioInicio(req.horarioInicio() != null ? req.horarioInicio() : "06:00");
        shift.setHorarioFim(req.horarioFim() != null ? req.horarioFim() : "12:00");
        shift.setDemanda(req.demanda() != null ? req.demanda() : "Demanda média");
        shift.setTipoDemanda(req.tipoDemanda() != null ? req.tipoDemanda() : "media");
        shift.setVagaPendente(req.vagaPendente());
        shift.setFuncao(req.funcao() != null ? req.funcao().trim() : "Geral");
        shift.setIntervalo(req.intervalo() != null ? req.intervalo().trim() : null);
        shift.setObservacoes(req.observacoes() != null ? req.observacoes().trim() : null);

        shift.getAssignments().clear();
        if (req.funcionarios() != null) {
            for (String funcNome : req.funcionarios()) {
                if (funcNome != null && !funcNome.isBlank()) {
                    shift.getAssignments().add(new ShiftAssignment(shift, funcNome.trim()));
                }
            }
        }

        Shift saved = shiftRepository.save(shift);
        return toDto(saved);
    }

    @Transactional
    public void deleteShift(UUID tenantId, UUID shiftId) {
        shiftRepository.findById(shiftId).ifPresent(s -> {
            if (s.getTenantId().equals(tenantId)) {
                shiftRepository.delete(s);
            }
        });
    }

    private ShiftDto toDto(Shift s) {
        List<String> funcs = s.getAssignments() != null
                ? s.getAssignments().stream().map(ShiftAssignment::getFuncionarioNome).toList()
                : List.of();

        String horarioFormatado = s.getHorarioInicio() + "–" + s.getHorarioFim();
        return new ShiftDto(
                s.getId(),
                s.getDiaSemana(),
                horarioFormatado,
                s.getHorarioInicio(),
                s.getHorarioFim(),
                s.getDemanda(),
                s.getTipoDemanda(),
                Boolean.TRUE.equals(s.getVagaPendente()),
                s.getFuncao() != null ? s.getFuncao() : "Geral",
                s.getIntervalo(),
                s.getObservacoes(),
                funcs
        );
    }
}
