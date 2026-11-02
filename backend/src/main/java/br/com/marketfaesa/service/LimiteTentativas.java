package br.com.marketfaesa.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import br.com.marketfaesa.error.ErroApiException;

// Limite de tentativas por chave, em janela fixa que começa na primeira tentativa.
// ponytail: os contadores ficam na memória de uma única instância: zeram ao reiniciar e, com N instâncias,
// o limite efetivo vira N vezes o configurado. Para escalar, mover para um armazenamento compartilhado
// (ex.: Redis com INCR e EXPIRE) mantendo as mesmas chaves.
public class LimiteTentativas {

    private static final class Contador {
        final Instant expiraEm;
        int tentativas;

        Contador(Instant expiraEm) {
            this.expiraEm = expiraEm;
        }
    }

    private final int maximo;
    private final Duration janela;
    private final Clock relogio;
    // Em ordem de inserção. Como a janela é a mesma para todos, é também a ordem de expiração.
    private final Map<String, Contador> contadores;

    public LimiteTentativas(int maximo, Duration janela, int maximoEntradas, Clock relogio) {
        this.maximo = maximo;
        this.janela = janela;
        this.relogio = relogio;
        // ponytail: acima do teto descarta o contador mais antigo, o que nunca bloqueia quem não errou, mas zera
        // aquele contador. Para forçar isso o atacante precisa de maximoEntradas tentativas novas dentro da janela.
        this.contadores = new LinkedHashMap<>() {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, Contador> maisAntigo) {
                return size() > maximoEntradas;
            }
        };
    }

    // Conta a tentativa antes do trabalho caro: requisições simultâneas não passam do limite.
    public synchronized void consumir(String chave) {
        Instant agora = relogio.instant();
        removerExpirados(agora);
        Contador contador = contadores.computeIfAbsent(chave, c -> new Contador(agora.plus(janela)));
        if (contador.tentativas >= maximo) {
            throw ErroApiException.muitasTentativas(minutosAte(contador.expiraEm, agora));
        }
        contador.tentativas++;
    }

    public synchronized void liberar(String chave) {
        contadores.remove(chave);
    }

    synchronized int tamanho() {
        return contadores.size();
    }

    // Para no primeiro que ainda vale, então cada entrada expirada é visitada uma única vez.
    private void removerExpirados(Instant agora) {
        var iterador = contadores.values().iterator();
        while (iterador.hasNext() && !iterador.next().expiraEm.isAfter(agora)) {
            iterador.remove();
        }
    }

    private static long minutosAte(Instant fim, Instant agora) {
        return Math.max(1, Duration.between(agora, fim).plusSeconds(59).toMinutes());
    }
}
