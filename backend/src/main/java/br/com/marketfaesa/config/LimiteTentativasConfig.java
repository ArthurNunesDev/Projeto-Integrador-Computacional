package br.com.marketfaesa.config;

import java.time.Clock;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import br.com.marketfaesa.service.LimiteTentativas;

/** Limites de login e cadastro; os valores estão em {@code app.limite.*}. */
@Configuration(proxyBeanMethods = false)
public class LimiteTentativasConfig {

    @Bean
    Clock relogio() {
        return Clock.systemUTC();
    }

    @Bean
    LimiteTentativas limiteLogin(@Value("${app.limite.login.maximo}") int maximo,
            @Value("${app.limite.login.janela}") Duration janela,
            @Value("${app.limite.maximo-entradas}") int maximoEntradas, Clock relogio) {
        return new LimiteTentativas(maximo, janela, maximoEntradas, relogio);
    }

    @Bean
    LimiteTentativas limiteCadastro(@Value("${app.limite.cadastro.maximo}") int maximo,
            @Value("${app.limite.cadastro.janela}") Duration janela,
            @Value("${app.limite.maximo-entradas}") int maximoEntradas, Clock relogio) {
        return new LimiteTentativas(maximo, janela, maximoEntradas, relogio);
    }
}
