package com.uninassau.demandarecife.push.support;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PushPayloadTest {

    @Test
    void montaOJsonComOsTresCampos() {
        assertThat(PushPayload.of("Acabou: Pão", "Compre 10", "K"))
                .isEqualTo("{\"title\":\"Acabou: Pão\",\"body\":\"Compre 10\",\"tag\":\"K\"}");
    }

    @Test
    void escapaAspasEQuebrasDeLinha() {
        assertThat(PushPayload.of("T", "Restam \"3\"\nunidades", "K"))
                .isEqualTo("{\"title\":\"T\",\"body\":\"Restam \\\"3\\\"\\nunidades\",\"tag\":\"K\"}");
    }

    @Test
    void nuloViraTextoVazio() {
        assertThat(PushPayload.of(null, null, null))
                .isEqualTo("{\"title\":\"\",\"body\":\"\",\"tag\":\"\"}");
    }
}