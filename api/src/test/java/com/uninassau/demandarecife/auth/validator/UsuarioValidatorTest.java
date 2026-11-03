package com.uninassau.demandarecife.auth.validator;

import com.uninassau.demandarecife.auth.dto.request.LoginRequest;
import com.uninassau.demandarecife.auth.dto.request.RegistroRequest;
import com.uninassau.demandarecife.auth.entity.Usuario;
import com.uninassau.demandarecife.auth.repository.UsuarioRepository;
import com.uninassau.demandarecife.shared.exception.BadRequestException;
import com.uninassau.demandarecife.shared.exception.ConflictException;
import com.uninassau.demandarecife.shared.exception.ForbiddenException;
import com.uninassau.demandarecife.shared.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioValidatorTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UsuarioValidator validator;

    @BeforeEach
    void setUp() {
        validator = new UsuarioValidator(usuarioRepository, passwordEncoder);
    }

    @Test
    void validarRegistro_quandoDadosValidos_sucesso() {
        RegistroRequest request = new RegistroRequest("Marina", "marina@padaria.com", "senha123");
        when(usuarioRepository.existsByEmail("marina@padaria.com")).thenReturn(false);

        assertThatCode(() -> validator.validarRegistro(request))
                .doesNotThrowAnyException();
    }

    @Test
    void validarRegistro_quandoEmailDuplicado_lancaConflictException() {
        RegistroRequest request = new RegistroRequest("Marina", "marina@padaria.com", "senha123");
        when(usuarioRepository.existsByEmail("marina@padaria.com")).thenReturn(true);

        assertThatThrownBy(() -> validator.validarRegistro(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Já existe um usuário cadastrado com este e-mail.");
    }

    @Test
    void validarRegistro_quandoSenhaCurta_lancaBadRequestException() {
        RegistroRequest request = new RegistroRequest("Marina", "marina@padaria.com", "123");

        assertThatThrownBy(() -> validator.validarRegistro(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("mínimo 6 caracteres");
    }

    @Test
    void validarRegistro_quandoEmailInvalido_lancaBadRequestException() {
        RegistroRequest request = new RegistroRequest("Marina", "email-invalido", "senha123");

        assertThatThrownBy(() -> validator.validarRegistro(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("formato inválido");
    }

    @Test
    void validarSenha_quandoSenhaIncorreta_lancaUnauthorizedException() {
        when(passwordEncoder.matches("errada", "hash_armazenado")).thenReturn(false);

        assertThatThrownBy(() -> validator.validarSenha("errada", "hash_armazenado"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Credenciais inválidas");
    }

    @Test
    void validarUsuarioAtivo_quandoInativo_lancaForbiddenException() {
        Usuario usuario = Usuario.builder().ativo(false).build();

        assertThatThrownBy(() -> validator.validarUsuarioAtivo(usuario))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("desativada ou bloqueada");
    }
}
