package com.uninassau.demandarecife.promotions.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** Os campos de simulação ficam nulos quando a chamada não informa desconto nem preço-alvo. */
public record PromotionSimulation(
        UUID productId,
        String produto,
        BigDecimal custo,
        BigDecimal precoAtual,
        BigDecimal margemAtualPercentual,
        BigDecimal descontoMaximoPercentual,   // desconto em que o preço iguala o custo
        BigDecimal precoMinimo,                // = custo
        BigDecimal descontoAplicadoPercentual,
        BigDecimal novoPreco,
        BigDecimal novaMargemPercentual,
        BigDecimal lucroUnitario,
        Status status
) {
    public enum Status { APROVADO, RISCO_FINANCEIRO }
}