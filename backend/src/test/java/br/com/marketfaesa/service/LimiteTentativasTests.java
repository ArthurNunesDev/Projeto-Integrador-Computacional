package br.com.marketfaesa.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import br.com.marketfaesa.error.ErroApiException;

class LimiteTentativasTests {

    private static final Duration JANELA = Duration.ofMinutes(10);

    private final Clock relogio = mock(Clock.class);
    private Instant agora = Instant.parse("2026-01-01T00:00:00Z");

    @BeforeEach
    void configurarRelogio() {
        when(relogio.instant()).thenAnswer(chamada -> agora);
    }

    @Test
    void removeAsEntradasExpiradasSemDependerDeNovasTentativasNaMesmaChave() {
        LimiteTentativas limite = new LimiteTentativas(5, JANELA, 1000, relogio);
        for (int i = 0; i < 100; i++) {
            limite.consumir("chave-" + i);
        }
        assertThat(limite.tamanho()).isEqualTo(100);

        agora = agora.plus(JANELA);
        limite.consumir("nova");

        assertThat(limite.tamanho()).isEqualTo(1);
    }

    @Test
    void mantemAsEntradasQueAindaValem() {
        LimiteTentativas limite = new LimiteTentativas(5, JANELA, 1000, relogio);
        limite.consumir("antiga");
        agora = agora.plus(JANELA).minusSeconds(1);
        limite.consumir("recente");
        assertThat(limite.tamanho()).isEqualTo(2);

        agora = agora.plusSeconds(1);
        limite.consumir("outra");

        assertThat(limite.tamanho()).isEqualTo(2);
    }

    @Test
    void naoPassaDoTetoDeEntradasMesmoSemNadaExpirado() {
        LimiteTentativas limite = new LimiteTentativas(5, JANELA, 10, relogio);

        for (int i = 0; i < 1000; i++) {
            limite.consumir("chave-" + i);
        }

        assertThat(limite.tamanho()).isEqualTo(10);
    }

    @Test
    void tentativaBloqueadaNaoEstendeAJanela() {
        LimiteTentativas limite = new LimiteTentativas(1, JANELA, 1000, relogio);
        limite.consumir("chave");

        agora = agora.plus(JANELA).minusSeconds(1);
        assertThatThrownBy(() -> limite.consumir("chave")).isInstanceOf(ErroApiException.class);

        agora = agora.plusSeconds(1);
        assertThatCode(() -> limite.consumir("chave")).doesNotThrowAnyException();
    }

    @Test
    void liberarRemoveAEntrada() {
        LimiteTentativas limite = new LimiteTentativas(5, JANELA, 1000, relogio);
        limite.consumir("chave");

        limite.liberar("chave");

        assertThat(limite.tamanho()).isZero();
    }
}
