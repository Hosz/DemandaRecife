package com.uninassau.demandarecife.tenants.mapper;

import com.uninassau.demandarecife.tenants.dto.OnboardingRequestDto;
import com.uninassau.demandarecife.tenants.dto.TenantProfileDto;
import com.uninassau.demandarecife.tenants.entity.Tenant;
import com.uninassau.demandarecife.tenants.entity.TenantProfile;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

@Component
public class TenantProfileMapper {

    public static TenantProfile toEntity(Tenant tenant, OnboardingRequestDto request) {
        LocalTime opening = (request.openingTime() != null && !request.openingTime().isBlank())
                ? LocalTime.parse(request.openingTime().trim())
                : null;

        LocalTime closing = (request.closingTime() != null && !request.closingTime().isBlank())
                ? LocalTime.parse(request.closingTime().trim())
                : null;

        String diasStr = (request.businessDays() != null && !request.businessDays().isEmpty())
                ? String.join(",", request.businessDays())
                : null;

        return TenantProfile.builder()
                .tenant(tenant)
                .responsavelNome(request.userName() != null ? request.userName().trim() : null)
                .horarioAbertura(opening)
                .horarioFechamento(closing)
                .diasFuncionamento(diasStr)
                .build();
    }

    public static TenantProfileDto toDto(TenantProfile profile) {
        if (profile == null) {
            return null;
        }

        List<String> dias = null;
        if (profile.getDiasFuncionamento() != null && !profile.getDiasFuncionamento().isBlank()) {
            dias = Arrays.stream(profile.getDiasFuncionamento().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .toList();
        }

        return new TenantProfileDto(
                profile.getId(),
                profile.getResponsavelNome(),
                profile.getHorarioAbertura(),
                profile.getHorarioFechamento(),
                dias
        );
    }
}
