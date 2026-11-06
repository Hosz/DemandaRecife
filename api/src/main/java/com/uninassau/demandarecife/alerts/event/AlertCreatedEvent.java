package com.uninassau.demandarecife.alerts.event;

import java.util.UUID;

/** Publicado quando um alerta novo é criado. O push só sai depois que a transação confirma. */
public record AlertCreatedEvent(UUID tenantId, UUID productId, String titulo,
                                String descricao, String prioridade, String chave) {}