package com.uninassau.demandarecife.recommendations.dto;

import com.uninassau.demandarecife.recommendations.entity.AiRecommendation;
import com.uninassau.demandarecife.recommendations.enums.RecommendationCategory;
import com.uninassau.demandarecife.recommendations.enums.RecommendationOrigin;
import com.uninassau.demandarecife.recommendations.enums.RecommendationStatus;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

public record AiRecommendationDto(
        UUID id,
        LocalDate dataReferencia,
        RecommendationCategory categoria,
        String titulo,
        String diagnostico,
        String acaoSugerida,
        String impactoEstimado,
        RecommendationOrigin origem,
        boolean fallback,
        RecommendationStatus status,
        Map<String, Object> payloadAcao
) {
    public AiRecommendationDto(
            UUID id,
            LocalDate dataReferencia,
            RecommendationCategory categoria,
            String titulo,
            String diagnostico,
            String acaoSugerida,
            String impactoEstimado,
            RecommendationOrigin origem,
            RecommendationStatus status,
            Map<String, Object> payloadAcao
    ) {
        this(id, dataReferencia, categoria, titulo, diagnostico, acaoSugerida, impactoEstimado,
                origem, origem == RecommendationOrigin.HEURISTICA_FALLBACK, status, payloadAcao);
    }

    public static AiRecommendationDto fromEntity(AiRecommendation entity) {
        if (entity == null) return null;
        return new AiRecommendationDto(
                entity.getId(),
                entity.getDataReferencia(),
                entity.getCategoria(),
                entity.getTitulo(),
                entity.getDiagnostico(),
                entity.getAcaoSugerida(),
                entity.getImpactoEstimado(),
                entity.getOrigem(),
                entity.getOrigem() == RecommendationOrigin.HEURISTICA_FALLBACK,
                entity.getStatus(),
                entity.getPayloadAcao()
        );
    }
}
