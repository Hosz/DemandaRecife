package com.uninassau.demandarecife.external.holidays;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "holidays_events")
@Getter
@Setter
@NoArgsConstructor
public class HolidayEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "data_evento", nullable = false)
    private LocalDate dataEvento;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(length = 50)
    private String tipo; // Feriado Nacional, Feriado Estadual, Feriado Municipal, Data Comemorativa

    @Column(length = 2)
    private String estado; // Null se for Feriado Nacional

    @Column(length = 100)
    private String cidade; // Null se for Nacional ou Estadual

    @Column(length = 100)
    private String bairro; // Null na maioria dos casos

    public HolidayEvent(LocalDate dataEvento, String nome, String tipo, String estado, String cidade) {
        this.dataEvento = dataEvento;
        this.nome = nome;
        this.tipo = tipo;
        this.estado = estado;
        this.cidade = cidade;
    }
}
