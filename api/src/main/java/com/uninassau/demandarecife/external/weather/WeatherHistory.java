package com.uninassau.demandarecife.external.weather;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "weather_history", uniqueConstraints = {
        @UniqueConstraint(name = "uq_weather_cidade_data", columnNames = {"cidade", "data_clima"})
})
@Getter
@Setter
@NoArgsConstructor
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
    private String condicao; // Rain, Clouds, Clear, etc.

    @Column(name = "precipitacao_mm", precision = 5, scale = 2)
    private BigDecimal precipitacaoMm;

    @Column(nullable = false, length = 20)
    private String status = "PREVISAO"; // PREVISAO ou CONSOLIDADO

    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;

    @PrePersist
    @PreUpdate
    public void prePersist() {
        this.atualizadoEm = LocalDateTime.now();
    }
}
