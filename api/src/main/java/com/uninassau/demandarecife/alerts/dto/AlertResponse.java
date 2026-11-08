package com.uninassau.demandarecife.alerts.dto;

import com.uninassau.demandarecife.alerts.entity.OperationalAlert;

import java.time.LocalDateTime;
import java.util.UUID;

public record AlertResponse(
        UUID id,
        UUID productId,
        String tipo,
        String titulo,
        String descricao,
        String prioridade,
        String status,
        Object dados,
        LocalDateTime criadoEm,
        LocalDateTime lidoEm,
        LocalDateTime resolvidoEm
) {
    public static AlertResponse from(OperationalAlert a) {
        return new AlertResponse(
                a.getId(), a.getProductId(),
                String.valueOf(a.getTipo()), a.getTitulo(), a.getDescricao(),
                String.valueOf(a.getPrioridade()), String.valueOf(a.getStatus()),
                a.getDados(), a.getCriadoEm(), a.getLidoEm(), a.getResolvidoEm());
    }
}