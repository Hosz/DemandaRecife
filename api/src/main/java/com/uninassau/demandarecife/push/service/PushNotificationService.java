package com.uninassau.demandarecife.push.service;

import com.uninassau.demandarecife.alerts.AlertCreatedEvent;
import com.uninassau.demandarecife.push.support.PushGateway;
import com.uninassau.demandarecife.push.support.PushPayload;
import com.uninassau.demandarecife.push.PushSubscription;
import com.uninassau.demandarecife.push.PushSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PushNotificationService {

    private final PushSubscriptionRepository repository;
    private final PushGateway gateway;

    public record Resumo(int enviados, int expirados, int falhas) {}

    // Depois do commit (alerta já gravado) e em outra thread (não atrasa o job)
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void aoCriarAlerta(AlertCreatedEvent e) {
        enviar(e.tenantId(), PushPayload.of(e.titulo(), e.descricao(), e.chave()));
    }

    public Resumo enviar(UUID tenantId, String payload) {
        int enviados = 0, expirados = 0, falhas = 0;
        for (PushSubscription sub : repository.findByTenantId(tenantId)) {
            switch (gateway.send(sub, payload)) {
                case SENT -> enviados++;
                case EXPIRED -> {
                    repository.deleteByEndpoint(sub.getEndpoint());   // limpa aparelho que não existe mais
                    expirados++;
                }
                case FAILED -> falhas++;
                case DISABLED -> {
                    return new Resumo(0, 0, 0);   // sem chaves VAPID: nada a fazer
                }
            }
        }
        if (enviados + expirados + falhas > 0) {
            log.info("Push do tenant {}: {} enviados, {} expirados, {} falhas", tenantId, enviados, expirados, falhas);
        }
        return new Resumo(enviados, expirados, falhas);
    }
}