
package com.uninassau.demandarecife.alerts;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OperationalAlertRepository
        extends JpaRepository<OperationalAlert, UUID> {

    // Lista todos os alertas de uma empresa.
    List<OperationalAlert> findByTenantIdOrderByCriadoEmDesc(
            UUID tenantId
    );

    // Lista somente os alertas ativos de uma empresa.
    List<OperationalAlert> findByTenantIdAndStatusOrderByCriadoEmDesc(
            UUID tenantId,
            String status
    );

    // Busca um alerta específico respeitando o tenant.
    Optional<OperationalAlert> findByIdAndTenantId(
            UUID id,
            UUID tenantId
    );

    // Verifica se já existe um alerta ativo com a mesma chave.
    boolean existsByTenantIdAndChaveDeduplicacaoAndStatus(
            UUID tenantId,
            String chaveDeduplicacao,
            String status
    );

    // Conta alertas ativos de uma empresa.
    long countByTenantIdAndStatus(
            UUID tenantId,
            String status
    );

    // Lista alertas não lidos.
    List<OperationalAlert> findByTenantIdAndLidoEmIsNullOrderByCriadoEmDesc(
            UUID tenantId
    );

    // Marca um alerta como lido, sem permitir acesso a outro tenant.
    @Modifying
    @Query("""
        UPDATE OperationalAlert a
        SET a.lidoEm = :dataLeitura,
            a.atualizadoEm = :dataLeitura
        WHERE a.id = :id
          AND a.tenantId = :tenantId
          AND a.lidoEm IS NULL
    """)
    int marcarComoLido(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId,
            @Param("dataLeitura") LocalDateTime dataLeitura
    );

    // Resolve um alerta, respeitando o tenant.
    @Modifying
    @Query("""
        UPDATE OperationalAlert a
        SET a.status = 'RESOLVIDO',
            a.resolvidoEm = :dataResolucao,
            a.atualizadoEm = :dataResolucao
        WHERE a.id = :id
          AND a.tenantId = :tenantId
          AND a.status = 'ATIVO'
    """)
    int resolverAlerta(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId,
            @Param("dataResolucao") LocalDateTime dataResolucao
    );
}
