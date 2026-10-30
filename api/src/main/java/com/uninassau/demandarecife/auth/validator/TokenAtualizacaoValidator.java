package com.uninassau.demandarecife.auth.validator;

import com.uninassau.demandarecife.auth.entity.TokenAtualizacao;
import com.uninassau.demandarecife.shared.exception.UnauthorizedException;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class TokenAtualizacaoValidator {

    public void validar(TokenAtualizacao token) {
        if (token == null) {
            throw new UnauthorizedException("Token de atualização não informado.");
        }
        if (token.isRevogado()) {
            throw new UnauthorizedException("Token de atualização já foi revogado.");
        }
        if (token.getExpiraEm().isBefore(Instant.now())) {
            throw new UnauthorizedException("Token de atualização expirado. Efetue login novamente.");
        }
    }
}
