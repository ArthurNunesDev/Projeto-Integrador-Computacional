package br.com.marketfaesa.error;

import java.util.Map;

import org.springframework.http.HttpStatus;

/**
 * Erro de regra de negocio com o status HTTP da resposta (404, 403, 409, 400);
 * vira {@link ErroResposta} no {@link ApiExceptionHandler}.
 */
public class ErroApiException extends RuntimeException {

    private final HttpStatus status;
    private final Map<String, String> campos;

    private ErroApiException(HttpStatus status, String erro, Map<String, String> campos) {
        super(erro);
        this.status = status;
        this.campos = campos;
    }

    public static ErroApiException naoEncontrado() {
        return new ErroApiException(HttpStatus.NOT_FOUND, "Recurso não encontrado", null);
    }

    // Recurso existe, mas é de outro usuário.
    public static ErroApiException acessoNegado() {
        return new ErroApiException(HttpStatus.FORBIDDEN, "Acesso negado", null);
    }

    public static ErroApiException conflito(String erro) {
        return new ErroApiException(HttpStatus.CONFLICT, erro, null);
    }

    public static ErroApiException requisicaoInvalida(String erro) {
        return new ErroApiException(HttpStatus.BAD_REQUEST, erro, null);
    }

    // Mesmo formato da validação do @Valid: {status: 400, erro: "Dados inválidos", campos: {campo: mensagem}}.
    public static ErroApiException campoInvalido(String campo, String mensagem) {
        return new ErroApiException(HttpStatus.BAD_REQUEST, "Dados inválidos", Map.of(campo, mensagem));
    }

    public HttpStatus getStatus() {
        return status;
    }

    public Map<String, String> getCampos() {
        return campos;
    }
}
