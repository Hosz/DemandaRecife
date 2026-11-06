package com.uninassau.demandarecife.push.support;

import com.uninassau.demandarecife.push.entity.PushSubscription;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Security;

@Slf4j
@Component
public class WebPushGateway implements PushGateway {

    private final PushService pushService;   // nulo quando as chaves VAPID não estão configuradas

    public WebPushGateway(PushProperties properties) {
        PushService service = null;
        if (properties.configured()) {
            try {
                if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
                    Security.addProvider(new BouncyCastleProvider());
                }
                service = new PushService(properties.getPublicKey(), properties.getPrivateKey(), properties.getSubject());
            } catch (Exception e) {
                log.error("Chaves VAPID inválidas: push desativado", e);
            }
        } else {
            log.warn("Chaves VAPID não configuradas: notificações push desativadas.");
        }
        this.pushService = service;
    }

    @Override
    public Result send(PushSubscription s, String payload) {
        if (pushService == null) return Result.DISABLED;
        try {
            var notification = new Notification(s.getEndpoint(), s.getP256dh(), s.getAuth(),
                    payload.getBytes(StandardCharsets.UTF_8));
            var response = pushService.send(notification);
            int status = response.getStatusLine().getStatusCode();
            if (status == 404 || status == 410) return Result.EXPIRED;   // aparelho não existe mais
            return (status >= 200 && status < 300) ? Result.SENT : Result.FAILED;
        } catch (Exception e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            log.warn("Falha ao enviar push: {}", e.getMessage());
            return Result.FAILED;
        }
    }
}