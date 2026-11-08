package com.uninassau.demandarecife.alerts.controller;

import com.uninassau.demandarecife.alerts.dto.AlertResponse;
import com.uninassau.demandarecife.alerts.service.AlertService;
import com.uninassau.demandarecife.shared.tenant.CurrentTenant;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService service;
    private final CurrentTenant currentTenant;

    @GetMapping
    public List<AlertResponse> listar(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "false") boolean apenasNaoLidos) {
        return service.listar(currentTenant.id(), status, apenasNaoLidos);
    }

    @GetMapping("/count")
    public Map<String, Long> contar() {
        return Map.of("ativos", service.contarAtivos(currentTenant.id()));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> marcarComoLido(@PathVariable UUID id) {
        service.marcarComoLido(currentTenant.id(), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<Void> resolver(@PathVariable UUID id) {
        service.resolver(currentTenant.id(), id);
        return ResponseEntity.noContent().build();
    }
}