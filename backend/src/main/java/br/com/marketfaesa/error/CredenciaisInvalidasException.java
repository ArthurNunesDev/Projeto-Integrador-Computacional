package br.com.marketfaesa.error;

/** E-mail ou senha incorretos no login; vira 401 no {@link ApiExceptionHandler}. */
public class CredenciaisInvalidasException extends RuntimeException {

    public CredenciaisInvalidasException() {
        super("E-mail ou senha inválidos");
    }
}
