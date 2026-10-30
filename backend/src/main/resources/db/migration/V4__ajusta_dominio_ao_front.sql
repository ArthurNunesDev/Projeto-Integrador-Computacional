-- Ajusta o schema do V1–V3 ao que as telas do front usam. V1–V3 já rodaram no Neon,
-- então as mudanças entram aqui como ALTER.

-- Oportunidades: o front tem o tipo "DIVULGAÇÃO" (código DIVULGACAO).
ALTER TABLE oportunidades DROP CONSTRAINT ck_oportunidades_tipo;
ALTER TABLE oportunidades ADD CONSTRAINT ck_oportunidades_tipo
    CHECK (tipo IN ('PROJETO', 'CONSULTORIA', 'PESQUISA', 'DESIGN', 'FREELA', 'MONITORIA', 'AULA', 'DIVULGACAO'));

-- Foto do perfil: o front manda a imagem como data URL (base64), bem maior que 500 caracteres.
-- O limite de tamanho fica na validação da API (UsuarioAtualizacaoRequisicao).
ALTER TABLE usuarios ALTER COLUMN foto_url TYPE text;

-- Os 4 níveis do front (Iniciante, Intermediário, Avançado, Especialista).
UPDATE usuario_habilidades SET nivel = 'INICIANTE' WHERE nivel = 'BASICO';
ALTER TABLE usuario_habilidades DROP CONSTRAINT ck_usuario_habilidades_nivel;
ALTER TABLE usuario_habilidades ADD CONSTRAINT ck_usuario_habilidades_nivel
    CHECK (nivel IN ('INICIANTE', 'INTERMEDIARIO', 'AVANCADO', 'ESPECIALISTA'));

-- Habilidade publicada como o front cria: nome livre (coluna titulo), categoria livre,
-- nível e disponibilidade. O vínculo com o catálogo e a modalidade passam a ser opcionais.
-- As colunas novas aceitam NULL para não quebrar linhas antigas; a API exige os campos.
ALTER TABLE habilidades_publicadas ALTER COLUMN habilidade_id DROP NOT NULL;
ALTER TABLE habilidades_publicadas ALTER COLUMN modalidade DROP NOT NULL;
ALTER TABLE habilidades_publicadas ADD COLUMN categoria varchar(60);
ALTER TABLE habilidades_publicadas ADD COLUMN nivel varchar(20);
ALTER TABLE habilidades_publicadas ADD COLUMN disponibilidade varchar(30);
ALTER TABLE habilidades_publicadas ADD CONSTRAINT ck_habilidades_publicadas_nivel
    CHECK (nivel IN ('INICIANTE', 'INTERMEDIARIO', 'AVANCADO', 'ESPECIALISTA'));
ALTER TABLE habilidades_publicadas ADD CONSTRAINT ck_habilidades_publicadas_disponibilidade
    CHECK (disponibilidade IN ('PROJETOS_FREELAS', 'PROJETOS_ACADEMICOS', 'MONITORIAS_AULAS', 'COLABORACOES'));
