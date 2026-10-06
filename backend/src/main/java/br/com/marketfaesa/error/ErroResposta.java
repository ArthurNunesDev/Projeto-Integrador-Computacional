package br.com.marketfaesa.error;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Corpo padrao de erro da API: {@code {status, erro, campos}}.
 * {@code campos} so aparece em erro de validacao (nome do campo -> mensagem).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErroResposta(int status, String erro, Map<String, String> campos) {

    public ErroResposta(int status, String erro) {
        this(status, erro, null);
    }
}
