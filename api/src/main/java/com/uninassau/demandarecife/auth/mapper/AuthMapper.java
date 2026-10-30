package com.uninassau.demandarecife.auth.mapper;

import com.uninassau.demandarecife.auth.dto.request.RegistroRequest;
import com.uninassau.demandarecife.auth.dto.response.LoginResponse;
import com.uninassau.demandarecife.auth.dto.response.RegistroResponse;
import com.uninassau.demandarecife.auth.dto.response.UsuarioResponse;
import com.uninassau.demandarecife.auth.entity.TokenAtualizacao;
import com.uninassau.demandarecife.auth.entity.Usuario;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class AuthMapper {

    public static Usuario toUsuario(RegistroRequest request, String senhaHash) {
        return Usuario.builder()
                .nome(request.nome().trim())
                .email(request.email().trim().toLowerCase())
                .senhaHash(senhaHash)
                .ativo(true)
                .build();
    }

    public static RegistroResponse toRegistroResponse(Usuario usuario) {
        return new RegistroResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail()
        );
    }

    public static LoginResponse toLoginResponse(Usuario usuario, String accessToken, String refreshToken, Long expiresIn) {
        UUID tenantId = (usuario.getTenant() != null) ? usuario.getTenant().getId() : null;

        return new LoginResponse(
                usuario.getId(),
                tenantId,
                usuario.getNome(),
                usuario.getEmail(),
                accessToken,
                refreshToken,
                "Bearer",
                expiresIn
        );
    }

    public static UsuarioResponse toUsuarioResponse(Usuario usuario) {
        UUID tenantId = (usuario.getTenant() != null) ? usuario.getTenant().getId() : null;

        return new UsuarioResponse(
                usuario.getId(),
                tenantId,
                usuario.getNome(),
                usuario.getEmail(),
                usuario.isAtivo()
        );
    }

    public static TokenAtualizacao toTokenAtualizacao(Usuario usuario, String token, Instant expiraEm) {
        return TokenAtualizacao.builder()
                .usuario(usuario)
                .token(token)
                .expiraEm(expiraEm)
                .revogado(false)
                .build();
    }
}
