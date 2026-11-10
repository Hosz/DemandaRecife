package com.uninassau.demandarecife.team.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "shifts")
@Getter
@Setter
@NoArgsConstructor
public class Shift {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "dia_semana", nullable = false, length = 10)
    private String diaSemana;

    @Column(name = "horario_inicio", nullable = false, length = 10)
    private String horarioInicio;

    @Column(name = "horario_fim", nullable = false, length = 10)
    private String horarioFim;

    @Column(length = 50)
    private String demanda;

    @Column(name = "tipo_demanda", length = 20)
    private String tipoDemanda;

    @Column(name = "vaga_pendente")
    private Boolean vagaPendente = false;

    @Column(length = 100)
    private String funcao = "Geral";

    @Column(length = 50)
    private String intervalo;

    @Column(length = 255)
    private String observacoes;

    @Column(name = "criado_em", insertable = false, updatable = false)
    private LocalDateTime criadoEm;

    @OneToMany(mappedBy = "shift", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ShiftAssignment> assignments = new ArrayList<>();
}
