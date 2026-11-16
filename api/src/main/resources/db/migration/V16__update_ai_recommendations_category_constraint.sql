-- =============================================================================
-- V16: Ajuste de constraint para suportar uma recomendação por área por dia
-- Permite que cada lojista tenha recomendações de ESTOQUE, EQUIPE, PROMOCAO e PREVISAO
-- =============================================================================

ALTER TABLE ai_recommendations
    DROP CONSTRAINT IF EXISTS uq_ai_recommendations_tenant_data;

ALTER TABLE ai_recommendations
    ADD CONSTRAINT uq_ai_recommendations_tenant_data_cat
    UNIQUE (tenant_id, data_referencia, categoria);
