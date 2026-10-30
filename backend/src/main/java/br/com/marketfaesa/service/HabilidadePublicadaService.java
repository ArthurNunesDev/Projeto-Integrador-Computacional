package br.com.marketfaesa.service;

import br.com.marketfaesa.dto.HabilidadePublicadaRequisicao;
import br.com.marketfaesa.dto.HabilidadePublicadaResposta;
import br.com.marketfaesa.dto.PessoaResumo;
import br.com.marketfaesa.error.ErroApiException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Habilidades publicadas ("o que eu ofereço"). No banco o nome fica na coluna titulo.
@Service
public class HabilidadePublicadaService {

    private static final String SELECT = """
            SELECT h.id, h.titulo, h.categoria, h.nivel, h.descricao, h.disponibilidade, h.criado_em, h.atualizado_em, %s
            FROM habilidades_publicadas h
            JOIN usuarios u ON u.id = h.usuario_id
            LEFT JOIN cursos c ON c.id = u.curso_id
            """.formatted(PessoaResumo.colunas("u", "c", "usuario"));

    private final JdbcClient jdbc;

    public HabilidadePublicadaService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    // Filtros opcionais; categoria compara sem diferenciar maiúsculas; busca procura no nome e na descrição.
    // ponytail: sem paginação; acrescentar LIMIT/OFFSET quando o volume crescer.
    @Transactional(readOnly = true)
    public List<HabilidadePublicadaResposta> listar(Long usuarioId, String categoria, String busca) {
        Map<String, Object> params = new HashMap<>();
        params.put("usuarioId", usuarioId);
        params.put("categoria", categoria == null || categoria.isBlank() ? null : categoria.trim());
        params.put("busca", busca == null || busca.isBlank() ? null : "%" + busca.trim() + "%");
        return consultar("""
                WHERE (CAST(:usuarioId AS bigint) IS NULL OR h.usuario_id = :usuarioId)
                  AND (CAST(:categoria AS varchar) IS NULL OR lower(h.categoria) = lower(:categoria))
                  AND (CAST(:busca AS varchar) IS NULL OR h.titulo ILIKE :busca OR h.descricao ILIKE :busca)
                ORDER BY h.criado_em DESC, h.id DESC
                """, params);
    }

    @Transactional(readOnly = true)
    public HabilidadePublicadaResposta buscar(Long id) {
        return consultar("WHERE h.id = :id", Map.of("id", id)).stream().findFirst()
                .orElseThrow(ErroApiException::naoEncontrado);
    }

    @Transactional
    public HabilidadePublicadaResposta criar(Long eu, HabilidadePublicadaRequisicao requisicao) {
        Long id = jdbc.sql("""
                INSERT INTO habilidades_publicadas (usuario_id, titulo, categoria, nivel, descricao, disponibilidade)
                VALUES (:eu, :nome, :categoria, :nivel, :descricao, :disponibilidade)
                RETURNING id
                """)
                .params(campos(requisicao))
                .param("eu", eu)
                .query(Long.class).single();
        return buscar(id);
    }

    @Transactional
    public HabilidadePublicadaResposta atualizar(Long eu, Long id, HabilidadePublicadaRequisicao requisicao) {
        exigirDono(eu, id);
        jdbc.sql("""
                UPDATE habilidades_publicadas SET titulo = :nome, categoria = :categoria, nivel = :nivel,
                       descricao = :descricao, disponibilidade = :disponibilidade, atualizado_em = now()
                WHERE id = :id
                """)
                .params(campos(requisicao))
                .param("id", id)
                .update();
        return buscar(id);
    }

    @Transactional
    public void excluir(Long eu, Long id) {
        exigirDono(eu, id);
        jdbc.sql("DELETE FROM habilidades_publicadas WHERE id = ?").param(id).update();
    }

    // 404 se não existe, 403 se é de outro usuário.
    private void exigirDono(Long eu, Long id) {
        Long dono = jdbc.sql("SELECT usuario_id FROM habilidades_publicadas WHERE id = ?").param(id)
                .query(Long.class).optional()
                .orElseThrow(ErroApiException::naoEncontrado);
        if (!dono.equals(eu)) {
            throw ErroApiException.acessoNegado();
        }
    }

    private static Map<String, Object> campos(HabilidadePublicadaRequisicao requisicao) {
        return Map.of("nome", requisicao.nome(), "categoria", requisicao.categoria(), "nivel", requisicao.nivel(),
                "descricao", requisicao.descricao(), "disponibilidade", requisicao.disponibilidade());
    }

    private List<HabilidadePublicadaResposta> consultar(String resto, Map<String, ?> params) {
        return jdbc.sql(SELECT + resto)
                .params(params)
                .query((rs, i) -> new HabilidadePublicadaResposta(rs.getLong("id"), rs.getString("titulo"),
                        rs.getString("categoria"), rs.getString("nivel"), rs.getString("descricao"),
                        rs.getString("disponibilidade"), PessoaResumo.de(rs, "usuario"),
                        rs.getTimestamp("criado_em").toInstant(), rs.getTimestamp("atualizado_em").toInstant()))
                .list();
    }
}
