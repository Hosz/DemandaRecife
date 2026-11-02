package com.uninassau.demandarecife.auth.validator;

import com.uninassau.demandarecife.auth.dto.request.LoginRequest;
import com.uninassau.demandarecife.auth.dto.request.RegistroRequest;
import com.uninassau.demandarecife.auth.entity.Usuario;
import com.uninassau.demandarecife.auth.repository.UsuarioRepository;
import com.uninassau.demandarecife.shared.exception.BadRequestException;
import com.uninassau.demandarecife.shared.exception.ConflictException;
import com.uninassau.demandarecife.shared.exception.ForbiddenException;
import com.uninassau.demandarecife.shared.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class UsuarioValidator {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final int SENHA_MIN_LENGTH = 6;
    private static final int MAX_NOME_LENGTH = 100;
    private static final int MAX_EMAIL_LENGTH = 100;

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public void validarRegistro(RegistroRequest request) {
        if (request == null) {
            throw new BadRequestException("A requisição de cadastro não pode ser nula.");
        }
        if (request.nome() == null || request.nome().isBlank()) {
            throw new BadRequestException("O nome é obrigatório para o cadastro.");
        }
        if (request.nome().trim().length() > MAX_NOME_LENGTH) {
            throw new BadRequestException("O nome não pode ter mais de " + MAX_NOME_LENGTH + " caracteres.");
        }
        if (request.email() == null || request.email().isBlank()) {
            throw new BadRequestException("O e-mail é obrigatório para o cadastro.");
        }
        if (request.email().trim().length() > MAX_EMAIL_LENGTH) {
            throw new BadRequestException("O e-mail não pode ter mais de " + MAX_EMAIL_LENGTH + " caracteres.");
        }
        if (!EMAIL_PATTERN.matcher(request.email().trim()).matches()) {
            throw new BadRequestException("O e-mail informado possui um formato inválido.");
        }
        if (request.senha() == null || request.senha().length() < SENHA_MIN_LENGTH) {
            throw new BadRequestException("A senha deve conter no mínimo " + SENHA_MIN_LENGTH + " caracteres.");
        }
        if (usuarioRepository.existsByEmail(request.email().trim().toLowerCase())) {
            throw new ConflictException("Já existe um usuário cadastrado com este e-mail.");
        }
    }

    public void validarLogin(LoginRequest request) {
        if (request == null) {
            throw new BadRequestException("A requisição de login não pode ser nula.");
        }
        if (request.email() == null || request.email().isBlank() || request.senha() == null || request.senha().isBlank()) {
            throw new UnauthorizedException("Credenciais inválidas: e-mail e senha são obrigatórios.");
        }
    }

    public void validarSenha(String senhaInformada, String senhaHashArmazenada) {
        if (!passwordEncoder.matches(senhaInformada, senhaHashArmazenada)) {
            throw new UnauthorizedException("Credenciais inválidas: e-mail ou senha incorretos.");
        }
    }

    public void validarUsuarioAtivo(Usuario usuario) {
        if (!usuario.isAtivo()) {
            throw new ForbiddenException("A conta de usuário está desativada ou bloqueada.");
        }
    }
}
