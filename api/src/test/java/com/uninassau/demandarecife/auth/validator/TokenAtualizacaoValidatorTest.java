package com.uninassau.demandarecife.auth.validator;

import com.uninassau.demandarecife.auth.entity.TokenAtualizacao;
import com.uninassau.demandarecife.shared.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TokenAtualizacaoValidatorTest {

    private TokenAtualizacaoValidator validator;

    @BeforeEach
    void setUp() {
        validator = new TokenAtualizacaoValidator();
    }

    @Test
    void validar_quandoTokenValido_sucesso() {
        TokenAtualizacao token = TokenAtualizacao.builder()
                .token("tok123")
                .revogado(false)
                .expiraEm(Instant.now().plusSeconds(3600))
                .build();

        assertThatCode(() -> validator.validar(token))
                .doesNotThrowAnyException();
    }

    @Test
    void validar_quandoRevogado_lancaUnauthorizedException() {
        TokenAtualizacao token = TokenAtualizacao.builder()
                .token("tok123")
                .revogado(true)
                .expiraEm(Instant.now().plusSeconds(3600))
                .build();

        assertThatThrownBy(() -> validator.validar(token))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("já foi revogado");
    }

    @Test
    void validar_quandoExpirado_lancaUnauthorizedException() {
        TokenAtualizacao token = TokenAtualizacao.builder()
                .token("tok123")
                .revogado(false)
                .expiraEm(Instant.now().minusSeconds(10))
                .build();

        assertThatThrownBy(() -> validator.validar(token))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("expirado");
    }
}
