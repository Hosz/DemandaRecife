-- ==============================================================================
-- 1. CORE DE ACESSO E MULTI-TENANCY
-- ==============================================================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18),
    nicho_atuacao VARCHAR(50),      -- Ex: Padaria, Salão (Para o Cold Start)
    ticket_medio NUMERIC(10, 2),    -- Informado no Onboarding
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(100) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    provider_id VARCHAR(255),       -- ID do usuário no Google/GitHub (via OAuth2)
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para acelerar a busca do usuário no momento do login via Token
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id);


-- ==============================================================================
-- 2. CATÁLOGO E ESTOQUE
-- ==============================================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    nome VARCHAR(100) NOT NULL,
    sku VARCHAR(50),
    custo_unidade NUMERIC(10, 2) NOT NULL,
    preco_venda NUMERIC(10, 2) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantidade_atual INTEGER NOT NULL DEFAULT 0,
    estoque_minimo INTEGER NOT NULL DEFAULT 5,
    tempo_reposicao_dias INTEGER NOT NULL DEFAULT 1,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimizar os filtros de produtos da empresa
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_inventory_tenant ON inventory_levels(tenant_id);


-- ==============================================================================
-- 3. MOTOR TRANSACIONAL (VENDAS)
-- ==============================================================================

CREATE TABLE sales_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantidade INTEGER NOT NULL,
    preco_unitario NUMERIC(10, 2) NOT NULL,
    data_hora_venda TIMESTAMP NOT NULL,
    origem VARCHAR(20),             -- Ex: 'MANUAL', 'CSV_UPLOAD'
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice COMPOSTO essencial para a IA buscar vendas por empresa em um período de tempo
CREATE INDEX idx_sales_tenant_date ON sales_transactions(tenant_id, data_hora_venda);


-- ==============================================================================
-- 4. EVENTOS EXÓGENOS (GLOBAIS)
-- Não possuem tenant_id pois afetam a todos
-- ==============================================================================

CREATE TABLE weather_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cidade VARCHAR(100) NOT NULL,
    data_clima DATE NOT NULL,
    temp_maxima NUMERIC(5, 2),
    temp_minima NUMERIC(5, 2),
    condicao VARCHAR(50),           -- Ex: 'Rain', 'Clear', 'Clouds'
    precipitacao_mm NUMERIC(5, 2)
);
CREATE INDEX idx_weather_city_date ON weather_history(cidade, data_clima);


CREATE TABLE holidays_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_evento DATE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50)                -- Ex: 'Feriado Nacional', 'Data Comemorativa'
);
CREATE INDEX idx_holidays_date ON holidays_events(data_evento);


-- ==============================================================================
-- 5. FEEDBACK PARA A IA (FEW-SHOT PROMPTING)
-- ==============================================================================

CREATE TABLE prediction_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    data_alvo DATE NOT NULL,
    valor_previsto_ia INTEGER NOT NULL,
    valor_real_informado INTEGER NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_tenant_date ON prediction_feedbacks(tenant_id, data_alvo);