package com.uninassau.demandarecife.shared.util;

import java.time.LocalDateTime;
import java.time.ZoneId;

public final class AppTime {

    public static final ZoneId ZONE = ZoneId.of("America/Recife");

    private AppTime() {}

    public static LocalDateTime now() {
        return LocalDateTime.now(ZONE);
    }
}