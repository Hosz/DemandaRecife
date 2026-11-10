package com.uninassau.demandarecife.forecast.benchmark;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "market_benchmarks")
@Getter
@Setter
@NoArgsConstructor
public class MarketBenchmark {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String nicho;

    @Column(name = "termo_produto", nullable = false, length = 120)
    private String termoProduto;

    @Column(name = "nome_sugerido", nullable = false, length = 120)
    private String nomeSugerido;

    @Column(length = 80)
    private String categoria;

    @Column(name = "preco_sugerido", precision = 10, scale = 2)
    private BigDecimal precoSugerido;

    @Column(name = "media_diaria", nullable = false, precision = 10, scale = 2)
    private BigDecimal mediaDiaria;

    @Column(length = 20)
    private String unidade;

    @Column(name = "destaque_catalogo")
    private Boolean destaqueCatalogo;

    @Column(name = "criado_em")
    private LocalDateTime criadoEm;

    public MarketBenchmark(String nicho, String termoProduto, String nomeSugerido, String categoria,
                           BigDecimal precoSugerido, BigDecimal mediaDiaria, String unidade, Boolean destaqueCatalogo) {
        this.nicho = nicho;
        this.termoProduto = termoProduto;
        this.nomeSugerido = nomeSugerido;
        this.categoria = categoria;
        this.precoSugerido = precoSugerido;
        this.mediaDiaria = mediaDiaria;
        this.unidade = unidade;
        this.destaqueCatalogo = destaqueCatalogo;
        this.criadoEm = LocalDateTime.now();
    }
}
