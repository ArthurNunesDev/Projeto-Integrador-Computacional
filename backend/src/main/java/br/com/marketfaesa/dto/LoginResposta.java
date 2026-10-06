package br.com.marketfaesa.dto;

// Resposta do login: o JWT e os dados do usuário.
public record LoginResposta(String token, UsuarioResposta usuario) {
}
