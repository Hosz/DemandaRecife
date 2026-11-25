package com.uninassau.demandarecife.recommendations.dto;

import java.util.Map;

public record GeminiRecommendationPayload(
        String categoria,
        String titulo,
        String diagnostico,
        String acaoSugerida,
        String impactoEstimado,
        String tipoAcao,
        Map<String, Object> detalhesAcao
) {}
