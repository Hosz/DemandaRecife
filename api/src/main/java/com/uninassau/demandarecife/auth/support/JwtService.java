package com.uninassau.demandarecife.auth.support;

import com.uninassau.demandarecife.auth.entity.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;

    @Value("${app.jwt.issuer:https://demandarecife.uninassau.edu.br}")
    private String issuer;

    @Value("${app.jwt.expiration:86400000}") // 24 horas por padrão
    private long accessTokenExpirationMs;

    @Value("${app.jwt.refresh-expiration:604800000}") // 7 dias por padrão
    private long refreshTokenExpirationMs;

    public String gerarAccessToken(Usuario usuario) {
        Instant agora = Instant.now();
        Instant expiraEm = agora.plusMillis(accessTokenExpirationMs);

        JwtClaimsSet.Builder claimsBuilder = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(agora)
                .expiresAt(expiraEm)
                .subject(usuario.getId().toString())
                .claim("nome", usuario.getNome())
                .claim("email", usuario.getEmail());

        if (usuario.getTenant() != null && usuario.getTenant().getId() != null) {
            claimsBuilder.claim("tenantId", usuario.getTenant().getId().toString());
        }

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claimsBuilder.build())).getTokenValue();
    }

    public String gerarRefreshToken() {
        return UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
    }

    public Instant calcularExpiracaoRefreshToken() {
        return Instant.now().plusMillis(refreshTokenExpirationMs);
    }

    public long getAccessTokenExpirationSeconds() {
        return accessTokenExpirationMs / 1000;
    }
}
