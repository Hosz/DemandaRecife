package com.uninassau.demandarecife.tenants.controller;

import com.uninassau.demandarecife.tenants.dto.OnboardingRequestDto;
import com.uninassau.demandarecife.tenants.dto.TenantResponseDto;
import com.uninassau.demandarecife.tenants.dto.UpdateTenantRequestDto;
import com.uninassau.demandarecife.tenants.service.TenantOnboardingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class TenantOnboardingController {

    private final TenantOnboardingService tenantOnboardingService;

    @PostMapping({"/api/auth/onboard", "/api/tenants/onboarding", "/api/tenants"})
    public ResponseEntity<TenantResponseDto> onboard(@Valid @RequestBody OnboardingRequestDto request) {
        TenantResponseDto response = tenantOnboardingService.onboard(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/tenants/{id}")
    public ResponseEntity<TenantResponseDto> getById(@PathVariable UUID id) {
        TenantResponseDto response = tenantOnboardingService.getById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/api/tenants/{id}")
    public ResponseEntity<TenantResponseDto> updateTenant(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTenantRequestDto request
    ) {
        TenantResponseDto response = tenantOnboardingService.updateTenant(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/api/tenants/{id}")
    public ResponseEntity<TenantResponseDto> patchTenant(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTenantRequestDto request
    ) {
        TenantResponseDto response = tenantOnboardingService.updateTenant(id, request);
        return ResponseEntity.ok(response);
    }
}
