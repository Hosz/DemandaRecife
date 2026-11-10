package com.uninassau.demandarecife.team.repository;

import com.uninassau.demandarecife.team.entity.Shift;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ShiftRepository extends JpaRepository<Shift, UUID> {
    List<Shift> findByTenantIdAndDiaSemanaOrderByHorarioInicioAsc(UUID tenantId, String diaSemana);
    List<Shift> findByTenantId(UUID tenantId);
}
