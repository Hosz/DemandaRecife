package com.uninassau.demandarecife.team.repository;

import com.uninassau.demandarecife.team.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {
    List<TeamMember> findByTenantIdOrderByNomeAsc(UUID tenantId);
    boolean existsByTenantIdAndNomeIgnoreCase(UUID tenantId, String nome);
}
