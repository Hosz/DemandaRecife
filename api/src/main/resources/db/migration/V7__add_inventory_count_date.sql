-- Quando o estoque foi contado/ajustado pela última vez.
-- Só vendas POSTERIORES a essa data baixam o estoque.
ALTER TABLE inventory_levels ADD COLUMN contado_em TIMESTAMP;
UPDATE inventory_levels SET contado_em = timezone('America/Recife', now());
ALTER TABLE inventory_levels ALTER COLUMN contado_em SET NOT NULL;
ALTER TABLE inventory_levels ALTER COLUMN contado_em SET DEFAULT timezone('America/Recife', now());
