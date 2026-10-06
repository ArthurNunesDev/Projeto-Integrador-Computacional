package br.com.marketfaesa.error;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Converte as excecoes da API no formato {@link ErroResposta}. */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErroResposta> validacao(MethodArgumentNotValidException e) {
        Map<String, String> campos = new LinkedHashMap<>();
        for (FieldError erro : e.getBindingResult().getFieldErrors()) {
            // primeira mensagem de cada campo
            campos.putIfAbsent(erro.getField(), erro.getDefaultMessage());
        }
        return resposta(HttpStatus.BAD_REQUEST, "Dados inválidos", campos);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ErroResposta> corpoInvalido(HttpMessageNotReadableException e) {
        return resposta(HttpStatus.BAD_REQUEST, "Corpo da requisição inválido", null);
    }

    @ExceptionHandler(EmailJaCadastradoException.class)
    ResponseEntity<ErroResposta> emailJaCadastrado(EmailJaCadastradoException e) {
        return resposta(HttpStatus.CONFLICT, e.getMessage(), null);
    }

    @ExceptionHandler(CredenciaisInvalidasException.class)
    ResponseEntity<ErroResposta> credenciaisInvalidas(CredenciaisInvalidasException e) {
        return resposta(HttpStatus.UNAUTHORIZED, e.getMessage(), null);
    }

    @ExceptionHandler(UsuarioNaoEncontradoException.class)
    ResponseEntity<ErroResposta> usuarioNaoEncontrado(UsuarioNaoEncontradoException e) {
        return resposta(HttpStatus.UNAUTHORIZED, e.getMessage(), null);
    }

    // Ex.: corrida no cadastro em que o UNIQUE de e-mail do banco barra o segundo insert.
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ErroResposta> violacaoDeIntegridade(DataIntegrityViolationException e) {
        return resposta(HttpStatus.CONFLICT, "Conflito com dados existentes", null);
    }

    // Demais erros: as excecoes do Spring MVC que ja carregam um status (404, 405, 415,
    // ResponseStatusException...) saem com esse status; o resto vira 500 sem detalhes.
    @ExceptionHandler(Exception.class)
    ResponseEntity<ErroResposta> outros(Exception e) {
        if (e instanceof ErrorResponse erro) {
            HttpStatusCode status = erro.getStatusCode();
            String mensagem = switch (status.value()) {
                case 401 -> "Não autenticado";
                case 404 -> "Recurso não encontrado";
                case 405 -> "Método não permitido";
                case 415 -> "Tipo de conteúdo não suportado";
                default -> {
                    HttpStatus conhecido = HttpStatus.resolve(status.value());
                    yield conhecido != null ? conhecido.getReasonPhrase() : "Erro";
                }
            };
            return ResponseEntity.status(status).headers(erro.getHeaders())
                    .body(new ErroResposta(status.value(), mensagem));
        }
        log.error("Erro nao tratado", e);
        return resposta(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno", null);
    }

    private static ResponseEntity<ErroResposta> resposta(HttpStatus status, String erro, Map<String, String> campos) {
        return ResponseEntity.status(status).body(new ErroResposta(status.value(), erro, campos));
    }
}
