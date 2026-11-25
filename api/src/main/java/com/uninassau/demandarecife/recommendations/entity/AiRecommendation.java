package com.uninassau.demandarecife.recommendations.entity;

import com.uninassau.demandarecife.recommendations.enums.RecommendationCategory;
import com.uninassau.demandarecife.recommendations.enums.RecommendationOrigin;
import com.uninassau.demandarecife.recommendations.enums.RecommendationStatus;
import com.uninassau.demandarecife.shared.util.AppTime;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "ai_recommendations")
@Getter
@Setter
@NoArgsConstructor
public class AiRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "data_referencia", nullable = false)
    private LocalDate dataReferencia;

    @Enumerated(EnumType.STRING)
    @Column(name = "categoria", nullable = false, length = 50)
    private RecommendationCategory categoria;

    @Column(name = "titulo", nullable = false, length = 150)
    private String titulo;

    @Column(name = "diagnostico", nullable = false, columnDefinition = "TEXT")
    private String diagnostico;

    @Column(name = "acao_sugerida", nullable = false, columnDefinition = "TEXT")
    private String acaoSugerida;

    @Column(name = "impacto_estimado", length = 150)
    private String impactoEstimado;

    @Enumerated(EnumType.STRING)
    @Column(name = "origem", nullable = false, length = 30)
    private RecommendationOrigin origem = RecommendationOrigin.IA_GEMINI;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RecommendationStatus status = RecommendationStatus.PENDENTE;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload_acao", columnDefinition = "jsonb")
    private Map<String, Object> payloadAcao;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    @Column(name = "aplicado_em")
    private LocalDateTime aplicadoEm;

    @PrePersist
    public void prePersist() {
        LocalDateTime agora = AppTime.now();
        if (criadoEm == null) {
            criadoEm = agora;
        }
        if (atualizadoEm == null) {
            atualizadoEm = agora;
        }
        if (status == null) {
            status = RecommendationStatus.PENDENTE;
        }
    }

    @PreUpdate
    public void preUpdate() {
        atualizadoEm = AppTime.now();
    }
}
