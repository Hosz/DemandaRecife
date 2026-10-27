package com.uninassau.demandarecife.shared.tenant;

import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CurrentTenant {
    public UUID id() {
        // TEMPORÁRIO: trocar pelo tenant do token quando a auth existir
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }
}
