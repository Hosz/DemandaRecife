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
