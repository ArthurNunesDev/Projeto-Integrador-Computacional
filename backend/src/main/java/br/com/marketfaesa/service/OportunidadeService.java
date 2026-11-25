package br.com.marketfaesa.service;

import br.com.marketfaesa.dto.AreaResposta;
import br.com.marketfaesa.dto.OportunidadeRequisicao;
import br.com.marketfaesa.dto.OportunidadeResposta;
import br.com.marketfaesa.dto.PessoaResumo;
import br.com.marketfaesa.error.ErroApiException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Oportunidades, participações e itens salvos. Em SQL (JdbcClient), como a busca do curso no UsuarioService:
// as listagens juntam autor, curso, áreas e contadores, o que em JPA pediria várias entidades só de leitura.
@Service
public class OportunidadeService {

    private static final String SELECT = """
            SELECT o.id, o.tipo, o.titulo, o.descricao, o.modalidade, o.status, o.criado_em, o.atualizado_em, %s,
                   (SELECT count(*) FROM participacoes p WHERE p.oportunidade_id = o.id) AS participantes,
                   EXISTS (SELECT 1 FROM participacoes p WHERE p.oportunidade_id = o.id AND p.usuario_id = :eu) AS participando,
                   EXISTS (SELECT 1 FROM itens_salvos s WHERE s.oportunidade_id = o.id AND s.usuario_id = :eu) AS salva
            FROM oportunidades o
            JOIN usuarios u ON u.id = o.autor_id
            LEFT JOIN cursos c ON c.id = u.curso_id
            """.formatted(PessoaResumo.colunas("u", "c", "autor"));

    private final JdbcClient jdbc;

    public OportunidadeService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    // Filtros opcionais; busca procura no título, na descrição e no nome do autor. Mais recentes primeiro.
    // ponytail: sem paginação; acrescentar LIMIT/OFFSET quando o volume crescer.
    @Transactional(readOnly = true)
    public List<OportunidadeResposta> listar(Long eu, String tipo, Long areaId, String modalidade, String status,
            Long autorId, String busca) {
        Map<String, Object> params = new HashMap<>();
        params.put("tipo", tipo);
        params.put("areaId", areaId);
        params.put("modalidade", modalidade);
        params.put("status", status);
        params.put("autorId", autorId);
        params.put("busca", busca == null || busca.isBlank() ? null : "%" + busca.trim() + "%");
        return consultar(eu, """
                WHERE (CAST(:tipo AS varchar) IS NULL OR o.tipo = :tipo)
                  AND (CAST(:modalidade AS varchar) IS NULL OR o.modalidade = :modalidade)
                  AND (CAST(:status AS varchar) IS NULL OR o.status = :status)
                  AND (CAST(:autorId AS bigint) IS NULL OR o.autor_id = :autorId)
                  AND (CAST(:areaId AS bigint) IS NULL OR EXISTS (
                        SELECT 1 FROM oportunidade_areas oa WHERE oa.oportunidade_id = o.id AND oa.area_id = :areaId))
                  AND (CAST(:busca AS varchar) IS NULL
                        OR o.titulo ILIKE :busca OR o.descricao ILIKE :busca OR u.nome ILIKE :busca)
                ORDER BY o.criado_em DESC, o.id DESC
                """, params);
    }

    @Transactional(readOnly = true)
    public OportunidadeResposta buscar(Long eu, Long id) {
        return consultar(eu, "WHERE o.id = :id", Map.of("id", id)).stream().findFirst()
                .orElseThrow(ErroApiException::naoEncontrado);
    }

    @Transactional(readOnly = true)
    public List<OportunidadeResposta> listarParticipacoes(Long eu) {
        return consultar(eu, """
                JOIN participacoes pa ON pa.oportunidade_id = o.id AND pa.usuario_id = :eu
                ORDER BY pa.criado_em DESC, o.id DESC
                """, Map.of());
    }

    @Transactional(readOnly = true)
    public List<OportunidadeResposta> listarSalvas(Long eu) {
        return consultar(eu, """
                JOIN itens_salvos sv ON sv.oportunidade_id = o.id AND sv.usuario_id = :eu
                ORDER BY sv.criado_em DESC, o.id DESC
                """, Map.of());
    }

    @Transactional
    public OportunidadeResposta criar(Long eu, OportunidadeRequisicao requisicao) {
        validarAreas(requisicao.areaIds());
        Long id = jdbc.sql("""
                INSERT INTO oportunidades (autor_id, tipo, titulo, descricao, modalidade, status)
                VALUES (:eu, :tipo, :titulo, :descricao, :modalidade, COALESCE(:status, 'ABERTA'))
                RETURNING id
                """)
                .params(campos(requisicao))
                .param("eu", eu)
                .query(Long.class).single();
        gravarAreas(id, requisicao.areaIds());
        return buscar(eu, id);
    }

    @Transactional
    public OportunidadeResposta atualizar(Long eu, Long id, OportunidadeRequisicao requisicao) {
        exigirAutor(eu, id);
        validarAreas(requisicao.areaIds());
        jdbc.sql("""
                UPDATE oportunidades SET tipo = :tipo, titulo = :titulo, descricao = :descricao,
                       modalidade = :modalidade, status = COALESCE(:status, status), atualizado_em = now()
                WHERE id = :id
                """)
                .params(campos(requisicao))
                .param("id", id)
                .update();
        jdbc.sql("DELETE FROM oportunidade_areas WHERE oportunidade_id = ?").param(id).update();
        gravarAreas(id, requisicao.areaIds());
        return buscar(eu, id);
    }

    @Transactional
    public void excluir(Long eu, Long id) {
        exigirAutor(eu, id);
        jdbc.sql("DELETE FROM oportunidades WHERE id = ?").param(id).update();
    }

    // Só oportunidades abertas e de outra pessoa.
    @Transactional
    public void participar(Long eu, Long id) {
        Situacao situacao = situacao(id);
        if (situacao.autorId().equals(eu)) {
            throw ErroApiException.requisicaoInvalida("Você não pode participar da própria oportunidade");
        }
        if (!"ABERTA".equals(situacao.status())) {
            throw ErroApiException.conflito("Oportunidade fechada");
        }
        int inseridas = jdbc.sql("""
                INSERT INTO participacoes (oportunidade_id, usuario_id) VALUES (?, ?) ON CONFLICT DO NOTHING
                """).params(id, eu).update();
        if (inseridas == 0) {
            throw ErroApiException.conflito("Você já participa desta oportunidade");
        }
    }

    @Transactional
    public void cancelarParticipacao(Long eu, Long id) {
        situacao(id);
        int removidas = jdbc.sql("DELETE FROM participacoes WHERE oportunidade_id = ? AND usuario_id = ?")
                .params(id, eu).update();
        if (removidas == 0) {
            throw ErroApiException.naoEncontrado();
        }
    }

    // Salvar e remover são idempotentes.
    @Transactional
    public void salvar(Long eu, Long id) {
        situacao(id);
        jdbc.sql("INSERT INTO itens_salvos (usuario_id, oportunidade_id) VALUES (?, ?) ON CONFLICT DO NOTHING")
                .params(eu, id).update();
    }

    @Transactional
    public void removerSalva(Long eu, Long id) {
        situacao(id);
        jdbc.sql("DELETE FROM itens_salvos WHERE usuario_id = ? AND oportunidade_id = ?").params(eu, id).update();
    }

    private static Map<String, Object> campos(OportunidadeRequisicao requisicao) {
        Map<String, Object> campos = new HashMap<>();
        campos.put("tipo", requisicao.tipo());
        campos.put("titulo", requisicao.titulo());
        campos.put("descricao", requisicao.descricao());
        campos.put("modalidade", requisicao.modalidade());
        campos.put("status", requisicao.status());
        return campos;
    }

    record Situacao(Long autorId, String status) {
    }

    private Situacao situacao(Long id) {
        return jdbc.sql("SELECT autor_id, status FROM oportunidades WHERE id = ?").param(id)
                .query(Situacao.class).optional()
                .orElseThrow(ErroApiException::naoEncontrado);
    }

    // 404 se não existe, 403 se é de outro usuário.
    private void exigirAutor(Long eu, Long id) {
        if (!situacao(id).autorId().equals(eu)) {
            throw ErroApiException.acessoNegado();
        }
    }

    private void validarAreas(List<Long> areaIds) {
        long encontradas = jdbc.sql("SELECT count(*) FROM areas_conhecimento WHERE id IN (:ids)")
                .param("ids", areaIds).query(Long.class).single();
        if (encontradas != areaIds.stream().distinct().count()) {
            throw ErroApiException.campoInvalido("areaIds", "área não encontrada");
        }
    }

    private void gravarAreas(Long id, List<Long> areaIds) {
        for (Long areaId : areaIds.stream().distinct().toList()) {
            jdbc.sql("INSERT INTO oportunidade_areas (oportunidade_id, area_id) VALUES (?, ?)").params(id, areaId).update();
        }
    }

    private List<OportunidadeResposta> consultar(Long eu, String resto, Map<String, ?> params) {
        List<OportunidadeResposta> lista = jdbc.sql(SELECT + resto)
                .param("eu", eu)
                .params(params)
                .query((rs, i) -> new OportunidadeResposta(rs.getLong("id"), rs.getString("tipo"),
                        rs.getString("titulo"), rs.getString("descricao"), rs.getString("modalidade"),
                        rs.getString("status"), new ArrayList<>(), PessoaResumo.de(rs, "autor"),
                        rs.getLong("participantes"), rs.getBoolean("participando"), rs.getBoolean("salva"),
                        rs.getTimestamp("criado_em").toInstant(), rs.getTimestamp("atualizado_em").toInstant()))
                .list();
        if (lista.isEmpty()) {
            return lista;
        }
        Map<Long, OportunidadeResposta> porId = new HashMap<>();
        lista.forEach(o -> porId.put(o.id(), o));
        jdbc.sql("""
                SELECT oa.oportunidade_id, a.id, a.nome FROM oportunidade_areas oa
                JOIN areas_conhecimento a ON a.id = oa.area_id
                WHERE oa.oportunidade_id IN (:ids) ORDER BY a.nome
                """)
                .param("ids", porId.keySet())
                .query(rs -> {
                    porId.get(rs.getLong("oportunidade_id")).areas()
                            .add(new AreaResposta(rs.getLong("id"), rs.getString("nome")));
                });
        return lista;
    }
}
