-- ==============================================================================
-- 1. ADAPTAÇÃO DA TABELA USERS PARA AUTENTICAÇÃO COM E-MAIL E SENHA
-- ==============================================================================

ALTER TABLE users ADD COLUMN senha_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Permite criação de conta de usuário antes de associar ao Tenant
ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;

-- ==============================================================================
-- 2. TABELA DE TOKENS DE ATUALIZAÇÃO (REFRESH TOKENS)
-- ==============================================================================

CREATE TABLE tokens_atualizacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expira_em TIMESTAMP NOT NULL,
    revogado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tokens_user ON tokens_atualizacao(user_id);
CREATE INDEX idx_tokens_token ON tokens_atualizacao(token);
