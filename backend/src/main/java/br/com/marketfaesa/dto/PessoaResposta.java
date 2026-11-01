package br.com.marketfaesa.dto;

import java.util.List;

// Perfil público de um usuário no diretório de pessoas. email só vem quando a pessoa ativou
// "mostrarEmail"; fotoUrl só vem em GET /api/pessoas/{id} (na lista é sempre null).
public record PessoaResposta(
        Long id,
        String nome,
        CursoResposta curso,
        Short periodo,
        String cidade,
        String bio,
        String email,
        String fotoUrl,
        List<Habilidade> habilidades) {

    // Resumo de uma habilidade publicada pela pessoa.
    public record Habilidade(Long id, String nome, String categoria, String nivel, String disponibilidade) {
    }
}
