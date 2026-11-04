package com.uninassau.demandarecife.alerts;

import com.uninassau.demandarecife.alerts.enums.AlertStatus;
import com.uninassau.demandarecife.alerts.enums.AlertType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OperationalAlertRepository extends JpaRepository<OperationalAlert, UUID> {

    List<OperationalAlert> findByTenantIdOrderByCriadoEmDesc(UUID tenantId);

    // Com limite: o painel diário (RF09) pede só os N mais recentes, para poupar rede móvel
    List<OperationalAlert> findByTenantIdOrderByCriadoEmDesc(UUID tenantId, Pageable pageable);

    List<OperationalAlert> findByTenantIdAndStatusOrderByCriadoEmDesc(UUID tenantId, AlertStatus status);

    List<OperationalAlert> findByTenantIdAndStatusOrderByCriadoEmDesc(UUID tenantId, AlertStatus status, Pageable pageable);

    List<OperationalAlert> findByTenantIdAndStatusAndTipoIn(UUID tenantId, AlertStatus status, Collection<AlertType> tipos);

    Optional<OperationalAlert> findByIdAndTenantId(UUID id, UUID tenantId);

    boolean existsByTenantIdAndChaveDeduplicacaoAndStatus(UUID tenantId, String chaveDeduplicacao, AlertStatus status);

    long countByTenantIdAndStatus(UUID tenantId, AlertStatus status);

    List<OperationalAlert> findByTenantIdAndLidoEmIsNullOrderByCriadoEmDesc(UUID tenantId);

    // Marca como lido, sem permitir acesso a outro tenant. Chame de um método @Transactional.
    @Modifying
    @Query("""
        UPDATE OperationalAlert a
        SET a.lidoEm = :dataLeitura,
            a.atualizadoEm = :dataLeitura
        WHERE a.id = :id
          AND a.tenantId = :tenantId
          AND a.lidoEm IS NULL
    """)
    int marcarComoLido(@Param("id") UUID id,
                       @Param("tenantId") UUID tenantId,
                       @Param("dataLeitura") LocalDateTime dataLeitura);

    // Troca o status de um alerta ativo, respeitando o tenant. Chame de um método @Transactional.
    @Modifying
    @Query("""
        UPDATE OperationalAlert a
        SET a.status = :novoStatus,
            a.resolvidoEm = :dataResolucao,
            a.atualizadoEm = :dataResolucao
        WHERE a.id = :id
          AND a.tenantId = :tenantId
          AND a.status = :statusAtual
    """)
    int atualizarStatus(@Param("id") UUID id,
                        @Param("tenantId") UUID tenantId,
                        @Param("statusAtual") AlertStatus statusAtual,
                        @Param("novoStatus") AlertStatus novoStatus,
                        @Param("dataResolucao") LocalDateTime dataResolucao);

    // Mantém o nome e a assinatura que o resto do código já usa
    default int resolverAlerta(UUID id, UUID tenantId, LocalDateTime dataResolucao) {
        return atualizarStatus(id, tenantId, AlertStatus.ATIVO, AlertStatus.RESOLVIDO, dataResolucao);
    }
}