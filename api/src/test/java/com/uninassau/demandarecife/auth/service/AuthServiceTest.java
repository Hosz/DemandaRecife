package com.uninassau.demandarecife.auth.service;

import com.uninassau.demandarecife.auth.dto.request.LoginRequest;
import com.uninassau.demandarecife.auth.dto.request.RefreshTokenRequest;
import com.uninassau.demandarecife.auth.dto.request.RegistroRequest;
import com.uninassau.demandarecife.auth.dto.response.LoginResponse;
import com.uninassau.demandarecife.auth.dto.response.RegistroResponse;
import com.uninassau.demandarecife.auth.entity.TokenAtualizacao;
import com.uninassau.demandarecife.auth.entity.Usuario;
import com.uninassau.demandarecife.auth.finder.TokenAtualizacaoFinder;
import com.uninassau.demandarecife.auth.finder.UserFinder;
import com.uninassau.demandarecife.auth.repository.TokenAtualizacaoRepository;
import com.uninassau.demandarecife.auth.repository.UsuarioRepository;
import com.uninassau.demandarecife.auth.support.JwtService;
import com.uninassau.demandarecife.auth.validator.TokenAtualizacaoValidator;
import com.uninassau.demandarecife.auth.validator.UsuarioValidator;
import com.uninassau.demandarecife.tenants.entity.Tenant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private TokenAtualizacaoRepository tokenAtualizacaoRepository;

    @Mock
    private UserFinder userFinder;

    @Mock
    private TokenAtualizacaoFinder tokenAtualizacaoFinder;

    @Mock
    private UsuarioValidator usuarioValidator;

    @Mock
    private TokenAtualizacaoValidator tokenAtualizacaoValidator;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                usuarioRepository,
                tokenAtualizacaoRepository,
                userFinder,
                tokenAtualizacaoFinder,
                usuarioValidator,
                tokenAtualizacaoValidator,
                passwordEncoder,
                jwtService
        );
    }

    @Test
    void registrar_quandoDadosValidos_cadastraERetornaRegistroResponse() {
        RegistroRequest request = new RegistroRequest("Marina", "marina@padaria.com", "senha123");
        UUID userId = UUID.randomUUID();

        when(passwordEncoder.encode("senha123")).thenReturn("encoded_senha123");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> {
            Usuario u = invocation.getArgument(0);
            u.setId(userId);
            return u;
        });

        RegistroResponse response = authService.registrar(request);

        verify(usuarioValidator).validarRegistro(request);
        verify(passwordEncoder).encode("senha123");
        verify(usuarioRepository).save(any(Usuario.class));

        assertThat(response).isNotNull();
        assertThat(response.userId()).isEqualTo(userId);
        assertThat(response.nome()).isEqualTo("Marina");
        assertThat(response.email()).isEqualTo("marina@padaria.com");
    }

    @Test
    void login_quandoCredenciaisCorretas_retornaLoginResponse() {
        LoginRequest request = new LoginRequest("marina@padaria.com", "senha123");
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();

        Usuario usuario = Usuario.builder()
                .id(userId)
                .nome("Marina")
                .email("marina@padaria.com")
                .senhaHash("encoded_senha123")
                .tenant(Tenant.builder().id(tenantId).build())
                .ativo(true)
                .build();

        when(userFinder.findByEmail("marina@padaria.com")).thenReturn(usuario);
        when(jwtService.gerarAccessToken(usuario)).thenReturn("access_token_jwt");
        when(jwtService.gerarRefreshToken()).thenReturn("refresh_token_uuid");
        when(jwtService.calcularExpiracaoRefreshToken()).thenReturn(Instant.now().plusSeconds(3600));
        when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(86400L);

        LoginResponse response = authService.login(request);

        verify(usuarioValidator).validarLogin(request);
        verify(usuarioValidator).validarUsuarioAtivo(usuario);
        verify(usuarioValidator).validarSenha("senha123", "encoded_senha123");
        verify(tokenAtualizacaoRepository).save(any(TokenAtualizacao.class));

        assertThat(response).isNotNull();
        assertThat(response.userId()).isEqualTo(userId);
        assertThat(response.tenantId()).isEqualTo(tenantId);
        assertThat(response.accessToken()).isEqualTo("access_token_jwt");
        assertThat(response.refreshToken()).isEqualTo("refresh_token_uuid");
    }

    @Test
    void refresh_quandoRefreshTokenValido_rotacionaERetornaNovoToken() {
        RefreshTokenRequest request = new RefreshTokenRequest("antigo_refresh");
        UUID userId = UUID.randomUUID();

        Usuario usuario = Usuario.builder()
                .id(userId)
                .nome("Marina")
                .email("marina@padaria.com")
                .ativo(true)
                .build();

        TokenAtualizacao tokenAtual = TokenAtualizacao.builder()
                .token("antigo_refresh")
                .usuario(usuario)
                .revogado(false)
                .expiraEm(Instant.now().plusSeconds(3600))
                .build();

        when(tokenAtualizacaoFinder.findByToken("antigo_refresh")).thenReturn(tokenAtual);
        when(jwtService.gerarAccessToken(usuario)).thenReturn("novo_access_jwt");
        when(jwtService.gerarRefreshToken()).thenReturn("novo_refresh_uuid");
        when(jwtService.calcularExpiracaoRefreshToken()).thenReturn(Instant.now().plusSeconds(3600));
        when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(86400L);

        LoginResponse response = authService.refresh(request);

        verify(tokenAtualizacaoValidator).validar(tokenAtual);
        assertThat(tokenAtual.isRevogado()).isTrue();
        verify(tokenAtualizacaoRepository, times(2)).save(any(TokenAtualizacao.class));

        assertThat(response.accessToken()).isEqualTo("novo_access_jwt");
        assertThat(response.refreshToken()).isEqualTo("novo_refresh_uuid");
    }
}
