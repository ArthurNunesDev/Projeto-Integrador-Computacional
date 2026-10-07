package br.com.marketfaesa.config;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

/**
 * Chave e codificadores do JWT (HS256). O segredo vem de {@code app.jwt.secret}
 * (variavel de ambiente {@code JWT_SECRET}) e precisa ter pelo menos 32 bytes.
 */
@Configuration(proxyBeanMethods = false)
public class JwtConfig {

    static final int TAMANHO_MINIMO_SEGREDO = 32;

    @Bean
    SecretKey jwtSecretKey(@Value("${app.jwt.secret:}") String segredo) {
        byte[] bytes = segredo.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < TAMANHO_MINIMO_SEGREDO) {
            throw new IllegalStateException("app.jwt.secret (variavel JWT_SECRET) precisa ter pelo menos "
                    + TAMANHO_MINIMO_SEGREDO + " bytes para HS256; tem " + bytes.length
                    + ". Gere um com: openssl rand -base64 48");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(jwtSecretKey));
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey jwtSecretKey) {
        return NimbusJwtDecoder.withSecretKey(jwtSecretKey).macAlgorithm(MacAlgorithm.HS256).build();
    }
}
