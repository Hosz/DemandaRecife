package com.uninassau.demandarecife.auth.service;

import com.uninassau.demandarecife.auth.dto.request.LoginRequest;
import com.uninassau.demandarecife.auth.dto.request.RefreshTokenRequest;
import com.uninassau.demandarecife.auth.dto.request.RegistroRequest;
import com.uninassau.demandarecife.auth.dto.response.LoginResponse;
import com.uninassau.demandarecife.auth.dto.response.RegistroResponse;
import com.uninassau.demandarecife.auth.dto.response.UsuarioResponse;
import com.uninassau.demandarecife.auth.entity.TokenAtualizacao;
import com.uninassau.demandarecife.auth.entity.Usuario;
import com.uninassau.demandarecife.auth.finder.TokenAtualizacaoFinder;
import com.uninassau.demandarecife.auth.finder.UserFinder;
import com.uninassau.demandarecife.auth.mapper.AuthMapper;
import com.uninassau.demandarecife.auth.repository.TokenAtualizacaoRepository;
import com.uninassau.demandarecife.auth.repository.UsuarioRepository;
import com.uninassau.demandarecife.auth.support.JwtService;
import com.uninassau.demandarecife.auth.validator.TokenAtualizacaoValidator;
import com.uninassau.demandarecife.auth.validator.UsuarioValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final TokenAtualizacaoRepository tokenAtualizacaoRepository;
    private final UserFinder userFinder;
    private final TokenAtualizacaoFinder tokenAtualizacaoFinder;
    private final UsuarioValidator usuarioValidator;
    private final TokenAtualizacaoValidator tokenAtualizacaoValidator;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public RegistroResponse registrar(RegistroRequest request) {
        usuarioValidator.validarRegistro(request);

        log.info("Iniciando cadastro do usuário '{}' com e-mail '{}'", request.nome(), request.email());

        String hash = passwordEncoder.encode(request.senha());
        Usuario usuario = AuthMapper.toUsuario(request, hash);
        Usuario salvo = usuarioRepository.save(usuario);

        log.info("Usuário cadastrado com sucesso! ID: {}", salvo.getId());
        return AuthMapper.toRegistroResponse(salvo);
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        usuarioValidator.validarLogin(request);

        Usuario usuario = userFinder.findByEmail(request.email());
        usuarioValidator.validarUsuarioAtivo(usuario);
        usuarioValidator.validarSenha(request.senha(), usuario.getSenhaHash());

        log.info("Login bem-sucedido para o usuário ID: {}", usuario.getId());

        String accessToken = jwtService.gerarAccessToken(usuario);
        String refreshToken = jwtService.gerarRefreshToken();
        Instant expiraEm = jwtService.calcularExpiracaoRefreshToken();

        TokenAtualizacao tokenEntity = AuthMapper.toTokenAtualizacao(usuario, refreshToken, expiraEm);
        tokenAtualizacaoRepository.save(tokenEntity);

        return AuthMapper.toLoginResponse(usuario, accessToken, refreshToken, jwtService.getAccessTokenExpirationSeconds());
    }

    @Transactional
    public LoginResponse refresh(RefreshTokenRequest request) {
        TokenAtualizacao tokenAtual = tokenAtualizacaoFinder.findByToken(request.refreshToken());
        tokenAtualizacaoValidator.validar(tokenAtual);

        Usuario usuario = tokenAtual.getUsuario();
        usuarioValidator.validarUsuarioAtivo(usuario);

        tokenAtual.setRevogado(true);
        tokenAtualizacaoRepository.save(tokenAtual);

        log.info("Token de atualização rotacionado com sucesso para o usuário ID: {}", usuario.getId());

        String novoAccessToken = jwtService.gerarAccessToken(usuario);
        String novoRefreshToken = jwtService.gerarRefreshToken();
        Instant novaExpiracao = jwtService.calcularExpiracaoRefreshToken();

        TokenAtualizacao novoTokenEntity = AuthMapper.toTokenAtualizacao(usuario, novoRefreshToken, novaExpiracao);
        tokenAtualizacaoRepository.save(novoTokenEntity);

        return AuthMapper.toLoginResponse(usuario, novoAccessToken, novoRefreshToken, jwtService.getAccessTokenExpirationSeconds());
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obterUsuarioAutenticado(UUID userId) {
        Usuario usuario = userFinder.findById(userId);
        return AuthMapper.toUsuarioResponse(usuario);
    }
}
