package com.uninassau.demandarecife.promotions.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "promotional_campaigns")
@Getter
@Setter
@NoArgsConstructor
public class PromotionalCampaign {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "product_id")
    private UUID productId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "product_ids", columnDefinition = "jsonb")
    private List<UUID> productIds;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(length = 255)
    private String detalhe;

    @Column(name = "desconto_percentual", nullable = false)
    private Integer descontoPercentual;

    @Column(name = "preco_promocional", nullable = false)
    private BigDecimal precoPromocional;

    @Column(nullable = false, length = 20)
    private String status = "Ativa";

    @Column(name = "data_campanha", length = 50)
    private String dataCampanha;

    @Column(name = "data_fim", length = 50)
    private String dataFim;

    @Column(name = "horario_inicio", length = 20)
    private String horarioInicio;

    @Column(name = "horario_fim", length = 20)
    private String horarioFim;

    @Column(name = "evento_vinculado", length = 150)
    private String eventoVinculado;

    @Column(name = "criado_em", insertable = false, updatable = false)
    private LocalDateTime criadoEm;

    public PromotionalCampaign(UUID tenantId, UUID productId, String titulo, String detalhe,
                               Integer descontoPercentual, BigDecimal precoPromocional,
                               String status, String dataCampanha, String dataFim, String eventoVinculado) {
        this(tenantId, productId, null, titulo, detalhe, descontoPercentual, precoPromocional,
                status, dataCampanha, dataFim, null, null, eventoVinculado);
    }

    public PromotionalCampaign(UUID tenantId, UUID productId, List<UUID> productIds, String titulo, String detalhe,
                               Integer descontoPercentual, BigDecimal precoPromocional,
                               String status, String dataCampanha, String dataFim,
                               String horarioInicio, String horarioFim, String eventoVinculado) {
        this.tenantId = tenantId;
        this.productId = productId;
        this.productIds = productIds;
        this.titulo = titulo;
        this.detalhe = detalhe;
        this.descontoPercentual = descontoPercentual;
        this.precoPromocional = precoPromocional;
        this.status = status;
        this.dataCampanha = dataCampanha;
        this.dataFim = dataFim;
        this.horarioInicio = horarioInicio;
        this.horarioFim = horarioFim;
        this.eventoVinculado = eventoVinculado;
    }
}
