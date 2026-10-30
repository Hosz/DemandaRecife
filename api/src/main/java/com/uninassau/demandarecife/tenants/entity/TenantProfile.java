package com.uninassau.demandarecife.tenants.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@Entity
@Table(name = "tenant_profiles")
public class TenantProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ToString.Exclude
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false, unique = true)
    private Tenant tenant;

    @Column(name = "responsavel_nome", length = 100)
    private String responsavelNome;

    @Column(name = "horario_abertura")
    private LocalTime horarioAbertura;

    @Column(name = "horario_fechamento")
    private LocalTime horarioFechamento;

    @Column(name = "dias_funcionamento", length = 100)
    private String diasFuncionamento;

    @Column(name = "atualizado_em")
    private Instant atualizadoEm;

    @PrePersist
    @PreUpdate
    public void prePersist() {
        this.atualizadoEm = Instant.now();
    }
}
