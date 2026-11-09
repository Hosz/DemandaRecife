package com.uninassau.demandarecife.team.controller;

import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import com.uninassau.demandarecife.team.dto.CreateMemberRequest;
import com.uninassau.demandarecife.team.dto.SaveShiftRequest;
import com.uninassau.demandarecife.team.dto.ShiftDto;
import com.uninassau.demandarecife.team.dto.TeamMemberDto;
import com.uninassau.demandarecife.team.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/team")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService service;
    private final CurrentTenant currentTenant;

    @GetMapping("/members")
    public List<TeamMemberDto> listMembers() {
        return service.listMembers(currentTenant.id());
    }

    @PostMapping("/members")
    @ResponseStatus(HttpStatus.CREATED)
    public TeamMemberDto addMember(@Valid @RequestBody CreateMemberRequest req) {
        return service.addMember(currentTenant.id(), req);
    }

    @DeleteMapping("/members/{id}")
    public ResponseEntity<Void> deleteMember(@PathVariable UUID id) {
        service.deleteMember(currentTenant.id(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/shifts")
    public List<ShiftDto> listShifts(@RequestParam(defaultValue = "Seg") String diaSemana) {
        return service.listShifts(currentTenant.id(), diaSemana);
    }

    @PostMapping("/shifts")
    public ShiftDto saveShift(@Valid @RequestBody SaveShiftRequest req) {
        return service.saveShift(currentTenant.id(), req);
    }

    @DeleteMapping("/shifts/{id}")
    public ResponseEntity<Void> deleteShift(@PathVariable UUID id) {
        service.deleteShift(currentTenant.id(), id);
        return ResponseEntity.noContent().build();
    }
}
