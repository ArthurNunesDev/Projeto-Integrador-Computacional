package br.com.marketfaesa.service;

import br.com.marketfaesa.dto.PessoaResposta;
import br.com.marketfaesa.dto.PessoaResumo;
import br.com.marketfaesa.error.ErroApiException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Diretório de pessoas. Respeita as configurações: perfil não público fica fora e o
// e-mail só aparece com "mostrarEmail". Sem configuração gravada valem os padrões (público, sem e-mail).
@Service
public class PessoaService {

    // O %s que sobra é a coluna da foto: NULL na lista, u.foto_url no detalhe.
    private static final String SELECT = """
            SELECT %s, u.cidade, u.bio, %%s AS foto_url,
                   CASE WHEN COALESCE(cfg.mostrar_email, false) THEN u.email END AS email
            FROM usuarios u
            LEFT JOIN cursos c ON c.id = u.curso_id
            LEFT JOIN configuracoes_usuario cfg ON cfg.usuario_id = u.id
            """.formatted(PessoaResumo.colunas("u", "c", "pessoa"));

    private final JdbcClient jdbc;

    public PessoaService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    // Outras pessoas com perfil público, por nome. busca: nome, curso ou nome de habilidade publicada;
    // categoria: tem ao menos uma habilidade publicada dessa categoria. Sem foto (ver PessoaResposta).
    // ponytail: sem paginação; acrescentar LIMIT/OFFSET quando o volume crescer.
    @Transactional(readOnly = true)
    public List<PessoaResposta> listar(Long eu, String busca, String categoria) {
        Map<String, Object> params = new HashMap<>();
        params.put("eu", eu);
        params.put("busca", busca == null || busca.isBlank() ? null : "%" + busca.trim() + "%");
        params.put("categoria", categoria == null || categoria.isBlank() ? null : categoria.trim());
        return consultar(SELECT.formatted("NULL") + """
                WHERE COALESCE(cfg.perfil_publico, true) AND u.id <> :eu
                  AND (CAST(:busca AS varchar) IS NULL OR u.nome ILIKE :busca OR c.nome ILIKE :busca
                       OR EXISTS (SELECT 1 FROM habilidades_publicadas h WHERE h.usuario_id = u.id AND h.titulo ILIKE :busca))
                  AND (CAST(:categoria AS varchar) IS NULL OR EXISTS (
                       SELECT 1 FROM habilidades_publicadas h WHERE h.usuario_id = u.id AND lower(h.categoria) = lower(:categoria)))
                ORDER BY u.nome, u.id
                """, params);
    }

    // Perfil não público só é visível para o próprio usuário (os demais recebem 404).
    @Transactional(readOnly = true)
    public PessoaResposta buscar(Long eu, Long id) {
        return consultar(SELECT.formatted("u.foto_url") + "WHERE u.id = :id AND (COALESCE(cfg.perfil_publico, true) OR u.id = :eu)",
                Map.of("id", id, "eu", eu)).stream().findFirst()
                .orElseThrow(ErroApiException::naoEncontrado);
    }

    private List<PessoaResposta> consultar(String sql, Map<String, ?> params) {
        List<PessoaResposta> pessoas = jdbc.sql(sql).params(params)
                .query((rs, i) -> {
                    PessoaResumo p = PessoaResumo.de(rs, "pessoa");
                    return new PessoaResposta(p.id(), p.nome(), p.curso(), p.periodo(), rs.getString("cidade"),
                            rs.getString("bio"), rs.getString("email"), rs.getString("foto_url"), new ArrayList<>());
                })
                .list();
        if (pessoas.isEmpty()) {
            return pessoas;
        }
        Map<Long, PessoaResposta> porId = new HashMap<>();
        pessoas.forEach(p -> porId.put(p.id(), p));
        jdbc.sql("""
                SELECT id, usuario_id, titulo, categoria, nivel, disponibilidade FROM habilidades_publicadas
                WHERE usuario_id IN (:ids) ORDER BY criado_em DESC, id DESC
                """)
                .param("ids", porId.keySet())
                .query(rs -> {
                    porId.get(rs.getLong("usuario_id")).habilidades().add(new PessoaResposta.Habilidade(
                            rs.getLong("id"), rs.getString("titulo"), rs.getString("categoria"),
                            rs.getString("nivel"), rs.getString("disponibilidade")));
                });
        return pessoas;
    }
}
