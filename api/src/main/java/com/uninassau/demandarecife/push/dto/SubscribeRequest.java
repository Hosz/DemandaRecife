package com.uninassau.demandarecife.push.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Mesmo formato do JSON que o navegador gera em subscription.toJSON(). */
public record SubscribeRequest(
        @NotBlank @Size(max = 2000) String endpoint,
        @NotNull @Valid Keys keys
) {
    public record Keys(@NotBlank String p256dh, @NotBlank String auth) {}
}