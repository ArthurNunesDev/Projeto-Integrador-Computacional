package br.com.marketfaesa.dto;

import java.sql.ResultSet;
import java.sql.SQLException;

// Dados públicos de outro usuário em listas (autor, conexão, conversa). Sem e-mail e sem foto,
// que pode ser uma data URL grande; a foto sai só em GET /api/pessoas/{id}.
public record PessoaResumo(Long id, String nome, CursoResposta curso, Short periodo) {

    // Colunas lidas por de(): o alias da tabela usuarios, o de cursos (LEFT JOIN) e um prefixo.
    public static String colunas(String usuario, String curso, String prefixo) {
        return "%1$s.id AS %3$s_id, %1$s.nome AS %3$s_nome, %1$s.periodo AS %3$s_periodo, %2$s.id AS %3$s_curso_id, %2$s.nome AS %3$s_curso_nome"
                .formatted(usuario, curso, prefixo);
    }

    public static PessoaResumo de(ResultSet rs, String prefixo) throws SQLException {
        long cursoId = rs.getLong(prefixo + "_curso_id");
        CursoResposta curso = rs.wasNull() ? null : new CursoResposta(cursoId, rs.getString(prefixo + "_curso_nome"));
        short periodo = rs.getShort(prefixo + "_periodo");
        return new PessoaResumo(rs.getLong(prefixo + "_id"), rs.getString(prefixo + "_nome"), curso,
                rs.wasNull() ? null : periodo);
    }
}
