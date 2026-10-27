package com.uninassau.demandarecife.sales;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sales_transactions")
@Getter
@Setter
@NoArgsConstructor
public class SaleTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID) // IDENTITY desligaria o batch
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "product_id", nullable = false)
    private UUID productId; // UUID simples: evita carregar Product em cada linha do lote

    @Column(nullable = false)
    private Integer quantidade;

    @Column(name = "preco_unitario", nullable = false)
    private BigDecimal precoUnitario;

    @Column(name = "data_hora_venda", nullable = false)
    private LocalDateTime dataHoraVenda;

    @Column(length = 20)
    private String origem; // MANUAL, CSV_UPLOAD, EXCEL_UPLOAD

    @Column(name = "criado_em", insertable = false, updatable = false)
    private LocalDateTime criadoEm;
}