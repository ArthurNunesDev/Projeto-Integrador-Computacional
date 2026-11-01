-- Dados iniciais dos catálogos: cursos de graduação da FAESA, áreas (as mesmas dos filtros
-- e categorias do front) e algumas habilidades por área. ON CONFLICT: não falha se alguém
-- já tiver cadastrado o mesmo nome à mão.

INSERT INTO cursos (nome) VALUES
    ('Administração'),
    ('Análise e Desenvolvimento de Sistemas'),
    ('Arquitetura e Urbanismo'),
    ('Biomedicina'),
    ('Ciência da Computação'),
    ('Ciências Contábeis'),
    ('Design Gráfico'),
    ('Direito'),
    ('Educação Física'),
    ('Enfermagem'),
    ('Engenharia Civil'),
    ('Engenharia de Computação'),
    ('Engenharia de Produção'),
    ('Engenharia Elétrica'),
    ('Engenharia Mecânica'),
    ('Estética e Cosmética'),
    ('Farmácia'),
    ('Fisioterapia'),
    ('Gastronomia'),
    ('Jornalismo'),
    ('Medicina'),
    ('Medicina Veterinária'),
    ('Nutrição'),
    ('Odontologia'),
    ('Pedagogia'),
    ('Psicologia'),
    ('Publicidade e Propaganda'),
    ('Sistemas de Informação')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO areas_conhecimento (nome) VALUES
    ('Tecnologia'),
    ('Saúde'),
    ('Direito'),
    ('Engenharia'),
    ('Administração'),
    ('Design'),
    ('Negócios'),
    ('Comunicação'),
    ('Educação'),
    ('Outras')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO habilidades (nome, area_id)
SELECT h.nome, a.id
FROM (VALUES
    ('JavaScript', 'Tecnologia'),
    ('React', 'Tecnologia'),
    ('Java', 'Tecnologia'),
    ('Python', 'Tecnologia'),
    ('SQL', 'Tecnologia'),
    ('Análise de Dados', 'Tecnologia'),
    ('Desenvolvimento Mobile', 'Tecnologia'),
    ('Primeiros Socorros', 'Saúde'),
    ('Nutrição Esportiva', 'Saúde'),
    ('Atendimento Clínico', 'Saúde'),
    ('Redação Jurídica', 'Direito'),
    ('Contratos', 'Direito'),
    ('Pesquisa Jurídica', 'Direito'),
    ('AutoCAD', 'Engenharia'),
    ('Cálculo Estrutural', 'Engenharia'),
    ('Gestão de Projetos', 'Administração'),
    ('Excel', 'Administração'),
    ('Finanças', 'Administração'),
    ('UX/UI Design', 'Design'),
    ('Figma', 'Design'),
    ('Identidade Visual', 'Design'),
    ('Empreendedorismo', 'Negócios'),
    ('Vendas', 'Negócios'),
    ('Marketing Digital', 'Comunicação'),
    ('Redação', 'Comunicação'),
    ('Oratória', 'Comunicação'),
    ('Monitoria', 'Educação'),
    ('Didática', 'Educação')
) AS h (nome, area)
JOIN areas_conhecimento a ON a.nome = h.area
ON CONFLICT (nome) DO NOTHING;
