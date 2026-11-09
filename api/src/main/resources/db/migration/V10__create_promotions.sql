CREATE TABLE IF NOT EXISTS promotional_campaigns (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    product_id UUID,
    titulo VARCHAR(150) NOT NULL,
    detalhe VARCHAR(255),
    desconto_percentual INT NOT NULL,
    preco_promocional NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativa',
    data_campanha VARCHAR(50),
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_campaigns_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_campaigns_tenant ON promotional_campaigns(tenant_id);
