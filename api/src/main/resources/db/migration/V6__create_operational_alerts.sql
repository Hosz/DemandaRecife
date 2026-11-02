
-- =============================================================================
-- RF03 - ALERTAS OPERACIONAIS ATIVOS
-- =============================================================================

CREATE TABLE operational_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenants(id) ON DELETE CASCADE,

    product_id UUID
        REFERENCES products(id) ON DELETE SET NULL,

    tipo VARCHAR(40) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,

    prioridade VARCHAR(20) NOT NULL DEFAULT 'MEDIA',

    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',

    dados JSONB,

    chave_deduplicacao VARCHAR(255),

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lido_em TIMESTAMP,
    resolvido_em TIMESTAMP
);

-- Consultas por empresa e status
CREATE INDEX idx_alerts_tenant_status
ON operational_alerts(tenant_id, status);

-- Ordenação dos alertas mais recentes
CREATE INDEX idx_alerts_tenant_created
ON operational_alerts(tenant_id, criado_em DESC);

-- Filtro por produto
CREATE INDEX idx_alerts_product
ON operational_alerts(product_id);

-- Evita duplicação de alertas ativos com a mesma chave
CREATE UNIQUE INDEX uq_alerts_active_deduplication
ON operational_alerts(tenant_id, chave_deduplicacao)
WHERE status = 'ATIVO' AND chave_deduplicacao IS NOT NULL;
