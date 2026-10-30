package com.uninassau.demandarecife.auth.finder;

import com.uninassau.demandarecife.auth.entity.Usuario;
import com.uninassau.demandarecife.auth.repository.UsuarioRepository;
import com.uninassau.demandarecife.shared.exception.ResourceNotFoundException;
import com.uninassau.demandarecife.shared.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserFinder {

    private final UsuarioRepository usuarioRepository;

    public Usuario findById(UUID userId) {
        return usuarioRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com ID: " + userId));
    }

    public Usuario findByEmail(String email) {
        return usuarioRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("Credenciais inválidas: e-mail ou senha incorretos."));
    }
}
