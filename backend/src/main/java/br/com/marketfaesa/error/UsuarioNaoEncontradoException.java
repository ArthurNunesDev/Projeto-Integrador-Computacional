package br.com.marketfaesa.error;

/**
 * Token valido de um usuario que nao existe mais (ex.: conta apagada); vira 401
 * no {@link ApiExceptionHandler}, como qualquer requisicao nao autenticada.
 */
public class UsuarioNaoEncontradoException extends RuntimeException {

    public UsuarioNaoEncontradoException() {
        super("Não autenticado");
    }
}
