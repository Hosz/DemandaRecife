-- =============================================================================
-- RF09 / SISTEMA DE RECOMENDAÇÃO COM IA
-- Armazenamento e padronização das recomendações geradas (Gemini / Heurística)
-- =============================================================================

CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenants(id) ON DELETE CASCADE,

    data_referencia DATE NOT NULL,

    categoria VARCHAR(50) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    diagnostico TEXT NOT NULL,
    acao_sugerida TEXT NOT NULL,
    impacto_estimado VARCHAR(150),

    origem VARCHAR(30) NOT NULL DEFAULT 'IA_GEMINI',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',

    payload_acao JSONB,

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    aplicado_em TIMESTAMP,

    CONSTRAINT uq_ai_recommendations_tenant_data UNIQUE (tenant_id, data_referencia)
);

CREATE INDEX idx_ai_rec_tenant_data
ON ai_recommendations(tenant_id, data_referencia DESC);

CREATE INDEX idx_ai_rec_tenant_status
ON ai_recommendations(tenant_id, status);
