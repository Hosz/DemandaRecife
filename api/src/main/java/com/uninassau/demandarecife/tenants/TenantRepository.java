package com.uninassau.demandarecife.tenants;

import com.uninassau.demandarecife.tenants.dto.LocationDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    @Query("SELECT DISTINCT new com.uninassau.demandarecife.tenants.dto.LocationDto(t.cidade, t.estado) " +
           "FROM Tenant t WHERE t.cidade IS NOT NULL AND TRIM(t.cidade) <> ''")
    List<LocationDto> findDistinctLocations();
}
