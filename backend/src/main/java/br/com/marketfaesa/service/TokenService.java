package br.com.marketfaesa.service;

import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import br.com.marketfaesa.model.Usuario;

/** Emite o JWT (HS256) do login. O {@code sub} e o id do usuario. */
@Service
public class TokenService {

    private final JwtEncoder encoder;
    private final Duration expiracao;

    public TokenService(JwtEncoder encoder, @Value("${app.jwt.expiracao:24h}") Duration expiracao) {
        this.encoder = encoder;
        this.expiracao = expiracao;
    }

    public String gerar(Usuario usuario) {
        Instant agora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(String.valueOf(usuario.getId()))
                .claim("email", usuario.getEmail())
                .issuedAt(agora)
                .expiresAt(agora.plus(expiracao))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
