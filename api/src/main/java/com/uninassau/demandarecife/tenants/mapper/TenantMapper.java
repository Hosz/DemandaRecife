package com.uninassau.demandarecife.tenants.mapper;

import com.uninassau.demandarecife.tenants.dto.OnboardingRequestDto;
import com.uninassau.demandarecife.tenants.dto.TenantProfileDto;
import com.uninassau.demandarecife.tenants.dto.TenantResponseDto;
import com.uninassau.demandarecife.tenants.entity.Tenant;
import com.uninassau.demandarecife.tenants.entity.TenantProfile;
import org.springframework.stereotype.Component;

@Component
public class TenantMapper {

    private static final String DEFAULT_CIDADE = "Recife";
    private static final String DEFAULT_ESTADO = "PE";

    public static Tenant toEntity(OnboardingRequestDto request) {
        String nomeTenant = (request.businessName() != null && !request.businessName().isBlank())
                ? request.businessName().trim()
                : request.userName().trim();

        String cidade = (request.cidade() != null && !request.cidade().isBlank())
                ? request.cidade().trim()
                : DEFAULT_CIDADE;

        String estado = (request.estado() != null && !request.estado().isBlank())
                ? request.estado().trim().toUpperCase()
                : DEFAULT_ESTADO;

        String bairro = (request.bairro() != null && !request.bairro().isBlank())
                ? request.bairro().trim()
                : null;

        String cnpj = (request.cnpj() != null && !request.cnpj().isBlank())
                ? request.cnpj().trim()
                : null;

        return Tenant.builder()
                .nome(nomeTenant)
                .cnpj(cnpj)
                .nichoAtuacao(request.niche() != null ? request.niche().trim() : null)
                .ticketMedio(request.averageTicket())
                .cidade(cidade)
                .estado(estado)
                .bairro(bairro)
                .build();
    }

    public static TenantResponseDto toResponseDto(Tenant tenant, TenantProfile profile) {
        TenantProfileDto profileDto = TenantProfileMapper.toDto(profile);

        return new TenantResponseDto(
                tenant.getId(),
                tenant.getNome(),
                tenant.getNichoAtuacao(),
                tenant.getTicketMedio(),
                tenant.getCidade(),
                tenant.getEstado(),
                tenant.getBairro(),
                profileDto,
                tenant.getCriadoEm()
        );
    }
}
