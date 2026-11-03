-- ==============================================================================
-- 1. LOCALIZAÇÃO DOS TENANTS (PARA CONSULTA DINÂMICA DE CLIMA E FERIADOS)
-- ==============================================================================
ALTER TABLE tenants ADD COLUMN cidade VARCHAR(100) DEFAULT 'Recife';
ALTER TABLE tenants ADD COLUMN estado VARCHAR(2) DEFAULT 'PE';
ALTER TABLE tenants ADD COLUMN bairro VARCHAR(100);

-- ==============================================================================
-- 2. AJUSTES EM WEATHER_HISTORY (PREVISÃO VS CONSOLIDADO E UNICIDADE)
-- ==============================================================================
ALTER TABLE weather_history ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PREVISAO';
ALTER TABLE weather_history ADD COLUMN estado VARCHAR(2) DEFAULT 'PE';
ALTER TABLE weather_history ADD COLUMN atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Constraint de unicidade para permitir upsert por cidade e data
ALTER TABLE weather_history ADD CONSTRAINT uq_weather_cidade_data UNIQUE (cidade, data_clima);

-- ==============================================================================
-- 3. AJUSTES EM HOLIDAYS_EVENTS (ESCOPO NACIONAL, ESTADUAL E MUNICIPAL)
-- ==============================================================================
ALTER TABLE holidays_events ADD COLUMN estado VARCHAR(2);
ALTER TABLE holidays_events ADD COLUMN cidade VARCHAR(100);
ALTER TABLE holidays_events ADD COLUMN bairro VARCHAR(100);

-- Índice único composto considerando valores nulos para feriados nacionais e estaduais
CREATE UNIQUE INDEX idx_holidays_unique ON holidays_events (
    data_evento,
    nome,
    COALESCE(estado, ''),
    COALESCE(cidade, ''),
    COALESCE(bairro, '')
);
