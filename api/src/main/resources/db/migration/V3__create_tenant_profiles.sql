-- ==============================================================================
-- 1. PERFIL DO TENANT E HORÁRIOS DE FUNCIONAMENTO (BASE PARA COLD START - RF07)
-- ==============================================================================

CREATE TABLE tenant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    responsavel_nome VARCHAR(100),
    horario_abertura TIME,
    horario_fechamento TIME,
    dias_funcionamento VARCHAR(100),
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenant_profiles_tenant ON tenant_profiles(tenant_id);
