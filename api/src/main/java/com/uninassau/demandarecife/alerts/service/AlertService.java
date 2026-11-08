package com.uninassau.demandarecife.alerts.service;

import com.uninassau.demandarecife.alerts.dto.AlertResponse;
import com.uninassau.demandarecife.alerts.entity.OperationalAlert;
import com.uninassau.demandarecife.alerts.repository.OperationalAlertRepository;
import com.uninassau.demandarecife.alerts.enums.AlertStatus;
import com.uninassau.demandarecife.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AlertService {

    private static final ZoneId ZONA = ZoneId.of("America/Recife");
    private static final int LIMITE = 100; // RNF03: listas sempre limitadas

    private final OperationalAlertRepository repository;

    @Transactional(readOnly = true)
    public List<AlertResponse> listar(UUID tenantId, String status, boolean apenasNaoLidos) {
        List<OperationalAlert> alertas;
        if (apenasNaoLidos) {
            alertas = repository.findByTenantIdAndLidoEmIsNullOrderByCriadoEmDesc(tenantId);
        } else if (status != null && !status.isBlank()) {
            alertas = repository.findByTenantIdAndStatusOrderByCriadoEmDesc(tenantId, AlertStatus.valueOf(status.toUpperCase()));
        } else {
            alertas = repository.findByTenantIdOrderByCriadoEmDesc(tenantId);
        }
        return alertas.stream().limit(LIMITE).map(AlertResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public long contarAtivos(UUID tenantId) {
        return repository.countByTenantIdAndStatus(tenantId, AlertStatus.valueOf("ATIVO"));
    }

    /** Idempotente: marcar de novo um alerta já lido não dá erro. */
    @Transactional
    public void marcarComoLido(UUID tenantId, UUID id) {
        garantirExiste(tenantId, id);
        repository.marcarComoLido(id, tenantId, LocalDateTime.now(ZONA));
    }

    /** Idempotente: resolver um alerta já resolvido não dá erro. */
    @Transactional
    public void resolver(UUID tenantId, UUID id) {
        garantirExiste(tenantId, id);
        repository.resolverAlerta(id, tenantId, LocalDateTime.now(ZONA));
    }

    // Alerta de outro tenant também cai aqui: 404, sem revelar que existe (RNF04)
    private void garantirExiste(UUID tenantId, UUID id) {
        repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Alerta não encontrado"));
    }
}