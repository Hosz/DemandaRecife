package com.uninassau.demandarecife.sales.dto;

public record RawSaleRow(int linha, String sku, String produto,
                         String quantidade, String preco, String data) {}
