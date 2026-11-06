package com.uninassau.demandarecife.push.support;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Getter
@Component
public class PushProperties {

    private final String publicKey;
    private final String privateKey;
    private final String subject;

    public PushProperties(
            @Value("${app.push.vapid-public-key:}") String publicKey,
            @Value("${app.push.vapid-private-key:}") String privateKey,
            @Value("${app.push.vapid-subject:mailto:contato@demandarecife.com}") String subject) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.subject = subject;
    }

    public boolean configured() {
        return !publicKey.isBlank() && !privateKey.isBlank();
    }
}