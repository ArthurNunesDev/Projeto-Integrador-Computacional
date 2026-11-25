-- Remove a tabela de contratações (criada no V3): a contratação de habilidade ficou fora do MVP
-- e nenhuma rota, entidade ou tela a usa. Nenhuma outra tabela referencia contratacoes, e o DROP
-- leva junto a chave primária, as FKs dela, uk_contratacoes_par, ck_contratacoes_status e
-- idx_contratacoes_solicitante.

DROP TABLE contratacoes;
