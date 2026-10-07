package br.com.marketfaesa.error;

/** E-mail ja usado por outro usuario; vira 409 no {@link ApiExceptionHandler}. */
public class EmailJaCadastradoException extends RuntimeException {

    public EmailJaCadastradoException() {
        super("E-mail já cadastrado");
    }
}
