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