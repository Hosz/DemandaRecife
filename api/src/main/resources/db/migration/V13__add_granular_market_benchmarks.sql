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
