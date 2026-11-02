package com.uninassau.demandarecife.external.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@Entity
@Table(name = "weather_history", uniqueConstraints = {
        @UniqueConstraint(name = "uq_weather_cidade_data", columnNames = {"cidade", "data_clima"})
})
public class WeatherHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String cidade;

    @Column(length = 2)
    private String estado;

    @Column(name = "data_clima", nullable = false)
    private LocalDate dataClima;

    @Column(name = "temp_maxima", precision = 5, scale = 2)
    private BigDecimal tempMaxima;

    @Column(name = "temp_minima", precision = 5, scale = 2)
    private BigDecimal tempMinima;

    @Column(length = 50)
    private String condicao;

    @Column(name = "precipitacao_mm", precision = 5, scale = 2)
    private BigDecimal precipitacaoMm;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PREVISAO";

    @Column(name = "atualizado_em")
    private Instant atualizadoEm;

    @PrePersist
    @PreUpdate
    public void prePersist() {
        this.atualizadoEm = Instant.now();
    }
}
