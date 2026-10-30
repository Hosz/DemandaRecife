package com.uninassau.demandarecife.auth.finder;

import com.uninassau.demandarecife.auth.entity.TokenAtualizacao;
import com.uninassau.demandarecife.auth.repository.TokenAtualizacaoRepository;
import com.uninassau.demandarecife.shared.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TokenAtualizacaoFinder {

    private final TokenAtualizacaoRepository tokenAtualizacaoRepository;

    public TokenAtualizacao findByToken(String token) {
        return tokenAtualizacaoRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Token de atualização inválido ou inexistente."));
    }
}
