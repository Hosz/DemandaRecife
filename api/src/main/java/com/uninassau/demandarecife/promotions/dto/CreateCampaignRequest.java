package com.uninassau.demandarecife.promotions.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateCampaignRequest(
        UUID productId,
        @NotBlank(message = "O título da campanha é obrigatório")
        @Size(max = 150, message = "O título deve ter no máximo 150 caracteres")
        String titulo,
        @Size(max = 255, message = "O detalhe deve ter no máximo 255 caracteres")
        String detalhe,
        int descontoPercentual,
        @NotNull(message = "O preço promocional é obrigatório")
        BigDecimal precoPromocional,
        @Size(max = 20, message = "O status deve ter no máximo 20 caracteres")
        String status,
        @Size(max = 50, message = "A data deve ter no máximo 50 caracteres")
        String data,
        @Size(max = 50, message = "A data fim deve ter no máximo 50 caracteres")
        String dataFim,
        @Size(max = 150, message = "O evento deve ter no máximo 150 caracteres")
        String eventoVinculado
) {
    public CreateCampaignRequest(UUID productId, String titulo, String detalhe,
                                 int descontoPercentual, BigDecimal precoPromocional, String status, String data) {
        this(productId, titulo, detalhe, descontoPercentual, precoPromocional, status, data, null, null);
    }
}
