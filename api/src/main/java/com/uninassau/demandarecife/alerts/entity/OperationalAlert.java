package com.uninassau.demandarecife.alerts.entity;

import com.uninassau.demandarecife.alerts.enums.AlertPriority;
import com.uninassau.demandarecife.alerts.enums.AlertStatus;
import com.uninassau.demandarecife.alerts.enums.AlertType;
import com.uninassau.demandarecife.shared.util.AppTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "operational_alerts")
@Getter @Setter @NoArgsConstructor
public class OperationalAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "product_id")
    private UUID productId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 40)
    private AlertType tipo;

    @Column(name = "titulo", nullable = false, length = 150)
    private String titulo;

    @Column(name = "descricao", nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(name = "prioridade", nullable = false, length = 20)
    private AlertPriority prioridade = AlertPriority.MEDIA;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AlertStatus status = AlertStatus.ATIVO;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dados", columnDefinition = "jsonb")
    private Map<String, Object> dados;

    @Column(name = "chave_deduplicacao", length = 255)
    private String chaveDeduplicacao;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    @Column(name = "lido_em")
    private LocalDateTime lidoEm;

    @Column(name = "resolvido_em")
    private LocalDateTime resolvidoEm;

    @PrePersist
    protected void aoCriar() {
        LocalDateTime agora = AppTime.now();
        if (criadoEm == null) criadoEm = agora;
        atualizadoEm = agora;
    }

    @PreUpdate
    protected void aoAtualizar() {
        atualizadoEm = AppTime.now();
    }
}