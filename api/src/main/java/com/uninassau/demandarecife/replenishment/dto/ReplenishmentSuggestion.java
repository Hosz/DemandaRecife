package com.uninassau.demandarecife.replenishment.dto;

import java.util.UUID;

public record ReplenishmentSuggestion(
        UUID productId,
        String produto,
        int estoqueAtual,
        int estoqueMinimo,
        int estoqueMaximo,
        boolean comprarAgora,
        int quantidadeSugerida,
        Metodo metodo
) {
    /** PREVISAO: calculado pelas vendas. PADRAO: produto sem histórico, usa o valor padrão. */
    public enum Metodo { PREVISAO, PADRAO }
}