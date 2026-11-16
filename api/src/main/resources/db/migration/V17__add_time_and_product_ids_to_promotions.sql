-- =============================================================================
-- V17: Adiciona suporte a horário de início/término e múltiplos produtos nas promoções
-- =============================================================================

ALTER TABLE promotional_campaigns
    ADD COLUMN IF NOT EXISTS horario_inicio VARCHAR(20),
    ADD COLUMN IF NOT EXISTS horario_fim VARCHAR(20),
    ADD COLUMN IF NOT EXISTS product_ids JSONB;
