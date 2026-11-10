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
