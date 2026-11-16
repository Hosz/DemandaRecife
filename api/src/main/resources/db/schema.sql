-- Schema consolidado do Demanda Recife. Gerado a partir das migrations Flyway V1..V17.
-- Pode ser executado como um único script SQL em um banco PostgreSQL vazio.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===== V1__create_initial_schema.sql =====
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

-- ===== V2__external_variables_and_tenant_location.sql =====
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


-- ===== V3__create_tenant_profiles.sql =====
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


-- ===== V4__add_auth_and_user_password.sql =====
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


-- ===== V5__create_sales_materialized_views.sql =====
-- Resumo diário por produto (alimenta a previsão do RF02)
CREATE MATERIALIZED VIEW mv_sales_daily AS
SELECT tenant_id,
       product_id,
       CAST(data_hora_venda AS DATE)    AS dia,
       SUM(quantidade)                  AS total_vendido,
       COUNT(*)                         AS volume_vendas,
       SUM(quantidade * preco_unitario) AS receita
FROM sales_transactions
GROUP BY tenant_id, product_id, CAST(data_hora_venda AS DATE);

-- O UNIQUE é obrigatório para usar REFRESH ... CONCURRENTLY
CREATE UNIQUE INDEX uq_mv_sales_daily ON mv_sales_daily (tenant_id, product_id, dia);


-- Padrão por dia da semana e hora (base para horários de pico e escala, RF05)
CREATE MATERIALIZED VIEW mv_sales_hourly AS
SELECT tenant_id,
       product_id,
       CAST(EXTRACT(ISODOW FROM data_hora_venda) AS INTEGER) AS dia_da_semana,  -- 1=segunda ... 7=domingo
       CAST(EXTRACT(HOUR FROM data_hora_venda) AS INTEGER)   AS hora,
       SUM(quantidade)                                       AS total_vendido,
       COUNT(*)                                              AS volume_vendas,
       SUM(quantidade * preco_unitario)                      AS receita,
       COUNT(DISTINCT CAST(data_hora_venda AS DATE))         AS dias_com_venda   -- para tirar a média por ocorrência
FROM sales_transactions
GROUP BY tenant_id, product_id,
         CAST(EXTRACT(ISODOW FROM data_hora_venda) AS INTEGER),
         CAST(EXTRACT(HOUR FROM data_hora_venda) AS INTEGER);

CREATE UNIQUE INDEX uq_mv_sales_hourly
    ON mv_sales_hourly (tenant_id, product_id, dia_da_semana, hora);

-- ===== V6__create_operational_alerts.sql =====

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


-- ===== V7__add_inventory_count_date.sql =====
-- Quando o estoque foi contado/ajustado pela última vez.
-- Só vendas POSTERIORES a essa data baixam o estoque.
ALTER TABLE inventory_levels ADD COLUMN contado_em TIMESTAMP;
UPDATE inventory_levels SET contado_em = timezone('America/Recife', now());
ALTER TABLE inventory_levels ALTER COLUMN contado_em SET NOT NULL;
ALTER TABLE inventory_levels ALTER COLUMN contado_em SET DEFAULT timezone('America/Recife', now());


-- ===== V8__create_push_subscriptions.sql =====
CREATE TABLE push_subscriptions (
                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                                    endpoint TEXT NOT NULL,
                                    p256dh VARCHAR(255) NOT NULL,
                                    auth VARCHAR(255) NOT NULL,
                                    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Um aparelho = um endpoint; reenviar a mesma subscription atualiza, não duplica
CREATE UNIQUE INDEX uq_push_endpoint ON push_subscriptions(endpoint);
CREATE INDEX idx_push_tenant ON push_subscriptions(tenant_id);

-- ===== V9__create_team_and_shifts.sql =====
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    nome VARCHAR(100) NOT NULL,
    cargo VARCHAR(50),
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_team_members_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_team_members_tenant ON team_members(tenant_id);

CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    dia_semana VARCHAR(10) NOT NULL,
    horario_inicio VARCHAR(10) NOT NULL,
    horario_fim VARCHAR(10) NOT NULL,
    demanda VARCHAR(50) DEFAULT 'Demanda média',
    tipo_demanda VARCHAR(20) DEFAULT 'media',
    vaga_pendente BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_shifts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_shifts_tenant_dia ON shifts(tenant_id, dia_semana);

CREATE TABLE IF NOT EXISTS shift_assignments (
    id UUID PRIMARY KEY,
    shift_id UUID NOT NULL,
    funcionario_nome VARCHAR(100) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_shift_assignments_shift FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
);

CREATE INDEX idx_shift_assignments_shift ON shift_assignments(shift_id);


-- ===== V10__create_promotions.sql =====
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


-- ===== V11__add_cold_start_and_shift_details.sql =====
-- ==============================================================================
-- V11: Suporte a toggle de Cold Start, detalhes operacionais de turnos e campanhas
-- ==============================================================================

-- 1. Cold start benchmark toggle no perfil do tenant
ALTER TABLE tenant_profiles ADD COLUMN IF NOT EXISTS usar_benchmarks_cold_start BOOLEAN DEFAULT TRUE;

-- 2. Detalhes operacionais dos turnos da equipe
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS funcao VARCHAR(100) DEFAULT 'Geral';
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS intervalo VARCHAR(50);
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS observacoes VARCHAR(255);

-- 3. Detalhes de campanhas promocionais (evento/feriado vinculado e data fim)
ALTER TABLE promotional_campaigns ADD COLUMN IF NOT EXISTS evento_vinculado VARCHAR(150);
ALTER TABLE promotional_campaigns ADD COLUMN IF NOT EXISTS data_fim VARCHAR(50);


-- ===== V12__create_market_benchmarks.sql =====
-- ==============================================================================
-- V12: RF07 - Base de conhecimento de benchmarks por segmento (Cold Start)
-- ==============================================================================

CREATE TABLE market_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nicho VARCHAR(100) NOT NULL,
    termo_produto VARCHAR(120) NOT NULL,
    nome_sugerido VARCHAR(120) NOT NULL,
    categoria VARCHAR(80),
    preco_sugerido NUMERIC(10, 2) DEFAULT 0.00,
    media_diaria NUMERIC(10, 2) NOT NULL,
    unidade VARCHAR(20) DEFAULT 'UN',
    destaque_catalogo BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_benchmarks_nicho ON market_benchmarks(nicho);
CREATE INDEX idx_market_benchmarks_termo ON market_benchmarks(termo_produto);

-- Inserção de dados iniciais calibrados para o mercado do Grande Recife / PE:

-- 1. Padaria / Confeitaria
INSERT INTO market_benchmarks (nicho, termo_produto, nome_sugerido, categoria, preco_sugerido, media_diaria, unidade, destaque_catalogo) VALUES
('padaria', 'pao frances', 'Pão Francês Tradicional', 'Panificação', 0.85, 320.00, 'UN', true),
('padaria', 'pao de queijo', 'Pão de Queijo Mineiro', 'Salgados', 4.50, 65.00, 'UN', true),
('padaria', 'cafe', 'Café Pingado / Expresso', 'Bebidas', 4.00, 75.00, 'UN', true),
('padaria', 'bolo', 'Bolo Caseiro (Fatia)', 'Confeitaria', 6.00, 28.00, 'UN', true),
('padaria', 'coxinha', 'Coxinha de Frango', 'Salgados', 6.50, 45.00, 'UN', false),
('padaria', 'suco', 'Suco de Fruta 300ml', 'Bebidas', 7.00, 35.00, 'UN', false);

-- 2. Restaurante / Bar
INSERT INTO market_benchmarks (nicho, termo_produto, nome_sugerido, categoria, preco_sugerido, media_diaria, unidade, destaque_catalogo) VALUES
('restaurante', 'prato feito', 'Prato Feito / Executivo', 'Refeições', 22.00, 45.00, 'UN', true),
('restaurante', 'cerveja', 'Cerveja Long Neck / Lata', 'Bebidas', 9.00, 60.00, 'UN', true),
('restaurante', 'refrigerante', 'Refrigerante Lata 350ml', 'Bebidas', 6.00, 40.00, 'UN', true),
('restaurante', 'petisco', 'Porção de Macaxeira com Charque', 'Petiscos', 32.00, 20.00, 'UN', true),
('restaurante', 'agua', 'Água Mineral 500ml', 'Bebidas', 4.00, 35.00, 'UN', false),
('restaurante', 'sobremesa', 'Pudim de Leite', 'Sobremesas', 8.00, 15.00, 'UN', false);

-- 3. Salão de Beleza / Estética
INSERT INTO market_benchmarks (nicho, termo_produto, nome_sugerido, categoria, preco_sugerido, media_diaria, unidade, destaque_catalogo) VALUES
('salao', 'corte masculino', 'Corte Masculino / Barba', 'Cabelo', 35.00, 12.00, 'ATENDIMENTO', true),
('salao', 'corte feminino', 'Corte Feminino', 'Cabelo', 60.00, 6.00, 'ATENDIMENTO', true),
('salao', 'manicure', 'Manicure e Pedicure', 'Unhas', 45.00, 14.00, 'ATENDIMENTO', true),
('salao', 'escova', 'Escova e Hidratação', 'Cabelo', 50.00, 8.00, 'ATENDIMENTO', true),
('salao', 'sobrancelha', 'Design de Sobrancelhas', 'Estética', 30.00, 9.00, 'ATENDIMENTO', false);

-- 4. Mercado / Mercearia
INSERT INTO market_benchmarks (nicho, termo_produto, nome_sugerido, categoria, preco_sugerido, media_diaria, unidade, destaque_catalogo) VALUES
('mercado', 'leite', 'Leite Integral 1L', 'Laticínios', 5.80, 38.00, 'UN', true),
('mercado', 'arroz', 'Arroz Branco 1kg', 'Mercearia', 6.20, 24.00, 'UN', true),
('mercado', 'feijao', 'Feijão Carioca 1kg', 'Mercearia', 7.90, 22.00, 'UN', true),
('mercado', 'oleo', 'Óleo de Soja 900ml', 'Mercearia', 6.50, 20.00, 'UN', true),
('mercado', 'acucar', 'Açúcar Cristal 1kg', 'Mercearia', 4.30, 18.00, 'UN', false),
('mercado', 'cafe', 'Café em Pó 250g', 'Mercearia', 9.50, 16.00, 'UN', false);

-- 5. Oficina / Autopeças
INSERT INTO market_benchmarks (nicho, termo_produto, nome_sugerido, categoria, preco_sugerido, media_diaria, unidade, destaque_catalogo) VALUES
('oficina', 'troca de oleo', 'Troca de Óleo Lubrificante', 'Serviços', 140.00, 8.00, 'SERVIÇO', true),
('oficina', 'alinhamento', 'Alinhamento e Balanceamento', 'Serviços', 90.00, 6.00, 'SERVIÇO', true),
('oficina', 'pastilha', 'Jogo de Pastilhas de Freio', 'Peças', 120.00, 4.00, 'UN', true),
('oficina', 'filtro de oleo', 'Filtro de Óleo Automotivo', 'Peças', 35.00, 8.00, 'UN', true),
('oficina', 'bateria', 'Bateria Automotiva 60Ah', 'Peças', 380.00, 2.00, 'UN', false);

-- 6. Loja de Roupas / Vestuário
INSERT INTO market_benchmarks (nicho, termo_produto, nome_sugerido, categoria, preco_sugerido, media_diaria, unidade, destaque_catalogo) VALUES
('vestuario', 'camiseta', 'Camiseta Básica Algodão', 'Vestuário', 39.90, 9.00, 'UN', true),
('vestuario', 'calca jeans', 'Calça Jeans Casual', 'Vestuário', 89.90, 5.00, 'UN', true),
('vestuario', 'bermuda', 'Bermuda Sarja / Jeans', 'Vestuário', 59.90, 5.00, 'UN', true),
('vestuario', 'vestido', 'Vestido Casual Estampado', 'Vestuário', 99.90, 4.00, 'UN', true);


-- ===== V13__add_granular_market_benchmarks.sql =====
-- ==============================================================================
-- V13: RF07 - Granularidade expandida de benchmarks por subsegmento (Cold Start)
-- ==============================================================================

-- 1. Confeitaria, Doceria & Cafeteria
INSERT INTO market_benchmarks (nicho, termo_produto, nome_sugerido, categoria, preco_sugerido, media_diaria, unidade, destaque_catalogo) VALUES
('confeitaria', 'bolo decorado', 'Bolo Confeitado (Fatia)', 'Confeitaria', 8.50, 25.00, 'UN', true),
('confeitaria', 'brownie', 'Brownie / Brigadeiro Gourmet', 'Doces', 5.00, 40.00, 'UN', true),
('confeitaria', 'cappuccino', 'Café Especial / Cappuccino', 'Bebidas', 7.50, 45.00, 'UN', true),
('confeitaria', 'torta doce', 'Torta Doce Holandesa (Fatia)', 'Confeitaria', 9.00, 30.00, 'UN', true),
('confeitaria', 'salgado fino', 'Folhado / Quiche Artesanal', 'Salgados', 7.00, 35.00, 'UN', false);

-- 2. Hamburgueria, Lanchonete & Pastelaria
INSERT INTO market_benchmarks (nicho, termo_produto, nome_sugerido, categoria, preco_sugerido, media_diaria, unidade, destaque_catalogo) VALUES
('hamburgueria', 'hamburguer artesanal', 'Hambúrguer Artesanal / Smash', 'Lanches', 28.00, 55.00, 'UN', true),
('hamburgueria', 'batata frita', 'Porção de Batata Frita Individual', 'Acompanhamentos', 14.00, 45.00, 'UN', true),
('hamburgueria', 'refrigerante lata', 'Refrigerante Lata 350ml', 'Bebidas', 6.00, 50.00, 'UN', true),
('hamburgueria', 'milk shake', 'Milk Shake Tradicional 400ml', 'Sobremesas', 16.00, 22.00, 'UN', true),
('hamburgueria', 'pastel', 'Pastel de Carne / Queijo', 'Lanches', 9.00, 40.00, 'UN', false);

-- 3. Pizzaria
INSERT INTO market_benchmarks (nicho, termo_produto, nome_sugerido, categoria, preco_sugerido, media_diaria, unidade, destaque_catalogo) VALUES
('pizzaria', 'pizza grande', 'Pizza Grande Tradicional (8 fatias)', 'Pizzas', 48.00, 35.00, 'UN', true),
('pizzaria', 'pizza doce', 'Pizza Média Doce (Chocolate/Banana)', 'Pizzas', 38.00, 16.00, 'UN', true),
('pizzaria', 'refrigerante 2l', 'Refrigerante 2 Litros', 'Bebidas', 12.00, 28.00, 'UN', true),
('pizzaria', 'borda recheada', 'Borda Recheada (Catupiry / Cheddar)', 'Adicionais', 8.00, 20.00, 'UN', true);

-- 4. Bar, Boteco & Petiscaria
INSERT INTO market_benchmarks (nicho, termo_produto, nome_sugerido, categoria, preco_sugerido, media_diaria, unidade, destaque_catalogo) VALUES
('bar', 'cerveja puro malte', 'Cerveja Puro Malte 600ml / Lata', 'Bebidas', 8.50, 75.00, 'UN', true),
('bar', 'porcao macaxeira', 'Porção de Macaxeira com Charque', 'Petiscos', 32.00, 22.00, 'UN', true),
('bar', 'espetinho', 'Espetinho na Brasa com Farofa', 'Petiscos', 10.00, 45.00, 'UN', true),
('bar', 'caipirinha', 'Caipirinha Tradicional de Fruta', 'Drinks', 14.00, 20.00, 'UN', true);

-- 5. Barbearia
INSERT INTO market_benchmarks (nicho, termo_produto, nome_sugerido, categoria, preco_sugerido, media_diaria, unidade, destaque_catalogo) VALUES
('barbearia', 'corte degrade', 'Corte Masculino / Degradê', 'Cabelo', 35.00, 14.00, 'ATENDIMENTO', true),
('barbearia', 'barba completa', 'Barba Completa com Toalha Quente', 'Barba', 25.00, 10.00, 'ATENDIMENTO', true),
('barbearia', 'combo cabelo barba', 'Combo Cabelo + Barba Alinhada', 'Combos', 55.00, 8.00, 'ATENDIMENTO', true),
('barbearia', 'pomada modeladora', 'Pomada Modeladora Efeito Matte', 'Produtos', 30.00, 3.00, 'UN', true),
('barbearia', 'sobrancelha masculina', 'Acabamento de Sobrancelha na Navalha', 'Estética', 15.00, 6.00, 'ATENDIMENTO', false);

-- 6. Esmalteria & Manicure
INSERT INTO market_benchmarks (nicho, termo_produto, nome_sugerido, categoria, preco_sugerido, media_diaria, unidade, destaque_catalogo) VALUES
('esmalteria', 'manicure tradicional', 'Manicure Tradicional', 'Unhas', 25.00, 16.00, 'ATENDIMENTO', true),
('esmalteria', 'pedicure', 'Pedicure com Esfoliação', 'Unhas', 28.00, 12.00, 'ATENDIMENTO', true),
('esmalteria', 'combo pe mao', 'Combo Pé e Mão Tradicional', 'Combos', 50.00, 10.00, 'ATENDIMENTO', true),
('esmalteria', 'alongamento gel', 'Alongamento / Banho em Gel', 'Unhas', 110.00, 4.00, 'ATENDIMENTO', true);

-- 7. Clínica de Estética & Sobrancelhas
INSERT INTO market_benchmarks (nicho, termo_produto, nome_sugerido, categoria, preco_sugerido, media_diaria, unidade, destaque_catalogo) VALUES
('estetica', 'design sobrancelhas', 'Design de Sobrancelhas com Henna', 'Sobrancelhas', 35.00, 12.00, 'ATENDIMENTO', true),
('estetica', 'limpeza de pele', 'Limpeza de Pele Profunda', 'Facial', 120.00, 4.00, 'ATENDIMENTO', true),
('estetica', 'depilacao cera', 'Depilação com Cera Morna', 'Depilação', 40.00, 8.00, 'ATENDIMENTO', true),
('estetica', 'massagem relaxante', 'Massagem Modeladora / Relaxante', 'Corporal', 90.00, 5.00, 'ATENDIMENTO', true);

-- 8. Hortifrúti & Frutaria
INSERT INTO market_benchmarks (nicho, termo_produto, nome_sugerido, categoria, preco_sugerido, media_diaria, unidade, destaque_catalogo) VALUES
('hortifruti', 'tomate', 'Tomate Italiano Selecionado (kg)', 'Legumes', 7.90, 45.00, 'KG', true),
('hortifruti', 'banana', 'Banana Prata da Região (kg)', 'Frutas', 6.50, 60.00, 'KG', true),
('hortifruti', 'cebola', 'Cebola Branca Nacional (kg)', 'Legumes', 5.80, 40.00, 'KG', true),
('hortifruti', 'batata', 'Batata Inglesa Lavada (kg)', 'Legumes', 6.20, 55.00, 'KG', true),
('hortifruti', 'alface', 'Alface Crespa Hidropônica (un)', 'Verduras', 3.50, 35.00, 'UN', false);

-- 9. Açougue & Casa de Carnes
INSERT INTO market_benchmarks (nicho, termo_produto, nome_sugerido, categoria, preco_sugerido, media_diaria, unidade, destaque_catalogo) VALUES
('acougue', 'carne moida', 'Carne Bovina Moída de Primeira (kg)', 'Bovinos', 32.00, 35.00, 'KG', true),
('acougue', 'peito frango', 'Filé de Peito de Frango Resfriado (kg)', 'Aves', 21.00, 45.00, 'KG', true),
('acougue', 'alcatra', 'Alcatra com Maminha Bovina (kg)', 'Bovinos', 42.00, 28.00, 'KG', true),
('acougue', 'linguica toscana', 'Linguiça Toscana para Churrasco (kg)', 'Embutidos', 22.00, 25.00, 'KG', true);

-- 10. Autopeças & Motopeças
INSERT INTO market_benchmarks (nicho, termo_produto, nome_sugerido, categoria, preco_sugerido, media_diaria, unidade, destaque_catalogo) VALUES
('autopecas', 'oleo sintetico', 'Óleo Lubrificante Sintético 1L', 'Lubrificantes', 42.00, 12.00, 'UN', true),
('autopecas', 'lampada farol', 'Lâmpada de Farol Automotivo H4/H7', 'Elétrica', 25.00, 8.00, 'UN', true),
('autopecas', 'filtro combustivel', 'Filtro de Combustível Injeção', 'Filtros', 28.00, 6.00, 'UN', true),
('autopecas', 'aditivo radiador', 'Aditivo de Radiador Concentrado 1L', 'Arrefecimento', 22.00, 10.00, 'UN', true);

-- 11. Lava-Jato & Estética Automotiva
INSERT INTO market_benchmarks (nicho, termo_produto, nome_sugerido, categoria, preco_sugerido, media_diaria, unidade, destaque_catalogo) VALUES
('lavajato', 'lavagem simples', 'Lavagem Simples com Cera Líquida', 'Lavagem', 40.00, 15.00, 'ATENDIMENTO', true),
('lavajato', 'lavagem completa', 'Lavagem Completa (Chassi e Motor)', 'Lavagem', 65.00, 8.00, 'ATENDIMENTO', true),
('lavajato', 'lavagem moto', 'Lavagem Completa de Moto', 'Lavagem', 25.00, 10.00, 'ATENDIMENTO', true),
('lavajato', 'higienizacao bancos', 'Higienização Interna de Bancos e Teto', 'Estética', 180.00, 2.00, 'ATENDIMENTO', true);


-- ===== V14__backfill_inventory_levels.sql =====
-- V14__backfill_inventory_levels.sql
-- Garante que todo produto existente no catálogo possua um registro correspondente em inventory_levels,
-- permitindo que a Prescrição de Compras (/compras) e Monitoramento de Rupturas (/estoque) funcionem imediatamente.

INSERT INTO inventory_levels (id, tenant_id, product_id, quantidade_atual, estoque_minimo, tempo_reposicao_dias, atualizado_em, contado_em)
SELECT
    gen_random_uuid(),
    p.tenant_id,
    p.id,
    0,
    5,
    2,
    CURRENT_TIMESTAMP,
    timezone('America/Recife', now())
FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM inventory_levels il WHERE il.product_id = p.id
);


-- ===== V15__create_ai_recommendations.sql =====
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


-- ===== V16__update_ai_recommendations_category_constraint.sql =====
-- =============================================================================
-- V16: Ajuste de constraint para suportar uma recomendação por área por dia
-- Permite que cada lojista tenha recomendações de ESTOQUE, EQUIPE, PROMOCAO e PREVISAO
-- =============================================================================

ALTER TABLE ai_recommendations
    DROP CONSTRAINT IF EXISTS uq_ai_recommendations_tenant_data;

ALTER TABLE ai_recommendations
    ADD CONSTRAINT uq_ai_recommendations_tenant_data_cat
    UNIQUE (tenant_id, data_referencia, categoria);


-- ===== V17__add_time_and_product_ids_to_promotions.sql =====
-- =============================================================================
-- V17: Adiciona suporte a horário de início/término e múltiplos produtos nas promoções
-- =============================================================================

ALTER TABLE promotional_campaigns
    ADD COLUMN IF NOT EXISTS horario_inicio VARCHAR(20),
    ADD COLUMN IF NOT EXISTS horario_fim VARCHAR(20),
    ADD COLUMN IF NOT EXISTS product_ids JSONB;


COMMIT;
