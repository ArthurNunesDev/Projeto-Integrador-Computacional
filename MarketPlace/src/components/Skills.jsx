import { useEffect, useState } from "react";

const CHAVE_HABILIDADES = "marketfaesa-habilidades";

const habilidadesIniciais = [
  {
    id: 1,
    nome: "JavaScript",
    categoria: "Tecnologia",
    nivel: "Avançado",
    descricao: "Desenvolvimento de interfaces e aplicações web.",
    disponibilidade: "Projetos e freelas",
  },
  {
    id: 2,
    nome: "React",
    categoria: "Tecnologia",
    nivel: "Intermediário",
    descricao: "Criação de interfaces modernas e componentes reutilizáveis.",
    disponibilidade: "Projetos acadêmicos",
  },
];

function obterHabilidades() {
  try {
    const salvo = localStorage.getItem(CHAVE_HABILIDADES);
    if (salvo) {
      const dados = JSON.parse(salvo);
      if (Array.isArray(dados)) return dados;
    }
  } catch {}
  return habilidadesIniciais;
}

function Habilidades({ onNavigate }) {
  const [habilidades, setHabilidades] = useState(obterHabilidades);
  const [criando, setCriando] = useState(false);
  const [salva, setSalva] = useState(false);
  const [formulario, setFormulario] = useState({
    nome: "",
    categoria: "Tecnologia",
    nivel: "Intermediário",
    descricao: "",
    disponibilidade: "Projetos e freelas",
  });

  useEffect(() => {
    localStorage.setItem(CHAVE_HABILIDADES, JSON.stringify(habilidades));
  }, [habilidades]);

  function alterarCampo(campo, valor) {
    setFormulario((estado) => ({ ...estado, [campo]: valor }));
  }

  function publicar(event) {
    event.preventDefault();

    if (!formulario.nome.trim() || !formulario.descricao.trim()) return;

    const novaHabilidade = {
      id: Date.now(),
      nome: formulario.nome.trim(),
      categoria: formulario.categoria,
      nivel: formulario.nivel,
      descricao: formulario.descricao.trim(),
      disponibilidade: formulario.disponibilidade,
    };

    setHabilidades((estado) => [novaHabilidade, ...estado]);
    setFormulario({
      nome: "",
      categoria: "Tecnologia",
      nivel: "Intermediário",
      descricao: "",
      disponibilidade: "Projetos e freelas",
    });
    setCriando(false);
    setSalva(true);
    window.setTimeout(() => setSalva(false), 2800);
  }

  return (
    <main className="skills-page">
      <div className="skills-container">
        <section className="skills-header animate__animated animate__fadeInDown">
          <div>
            <span className="skills-eyebrow">MINHAS COMPETÊNCIAS</span>
            <h1>Habilidades</h1>
            <p>Mostre o que você sabe fazer e encontre pessoas interessadas em trabalhar com você.</p>
          </div>
          <button className="skills-create-button" type="button" onClick={() => setCriando(true)}>
            + Criar habilidade
          </button>
        </section>

        {salva && (
          <div className="skills-success animate__animated animate__fadeIn" role="status">
            ✓ Habilidade publicada com sucesso.
          </div>
        )}

        {criando && (
          <section className="skill-form-card animate__animated animate__fadeInUp">
            <div className="skill-form-heading">
              <div>
                <span>NOVA PUBLICAÇÃO</span>
                <h2>Criar uma habilidade</h2>
                <p>Preencha as informações para apresentar sua competência.</p>
              </div>
              <button type="button" className="skill-form-close" onClick={() => setCriando(false)} aria-label="Fechar">×</button>
            </div>

            <form onSubmit={publicar}>
              <div className="skill-form-grid">
                <label>
                  <span>Nome da habilidade</span>
                  <input value={formulario.nome} onChange={(event) => alterarCampo("nome", event.target.value)} placeholder="Ex.: Desenvolvimento Web" required />
                </label>

                <label>
                  <span>Categoria</span>
                  <select value={formulario.categoria} onChange={(event) => alterarCampo("categoria", event.target.value)}>
                    <option>Tecnologia</option>
                    <option>Design</option>
                    <option>Negócios</option>
                    <option>Comunicação</option>
                    <option>Saúde</option>
                    <option>Direito</option>
                    <option>Engenharia</option>
                    <option>Outras</option>
                  </select>
                </label>

                <label>
                  <span>Nível</span>
                  <select value={formulario.nivel} onChange={(event) => alterarCampo("nivel", event.target.value)}>
                    <option>Iniciante</option>
                    <option>Intermediário</option>
                    <option>Avançado</option>
                    <option>Especialista</option>
                  </select>
                </label>

                <label>
                  <span>Disponibilidade</span>
                  <select value={formulario.disponibilidade} onChange={(event) => alterarCampo("disponibilidade", event.target.value)}>
                    <option>Projetos e freelas</option>
                    <option>Projetos acadêmicos</option>
                    <option>Monitorias e aulas</option>
                    <option>Colaborações</option>
                  </select>
                </label>

                <label className="skill-form-full">
                  <span>Sobre esta habilidade</span>
                  <textarea value={formulario.descricao} onChange={(event) => alterarCampo("descricao", event.target.value)} placeholder="Conte brevemente o que você sabe fazer, ferramentas que domina e em quais atividades pode ajudar." rows={5} required />
                </label>
              </div>

              <div className="skill-form-footer">
                <button type="button" className="skill-cancel-button" onClick={() => setCriando(false)}>Cancelar</button>
                <button type="submit" className="skill-submit-button">Publicar habilidade</button>
              </div>
            </form>
          </section>
        )}

        <section className="skills-list-heading animate__animated animate__fadeInUp">
          <div>
            <span>PUBLICADAS</span>
            <h2>Minhas habilidades <b>{habilidades.length}</b></h2>
          </div>
          <button type="button" onClick={() => setCriando(true)}>+ Adicionar</button>
        </section>

        <section className="skills-grid">
          {habilidades.map((habilidade, index) => (
            <article className="skill-card animate__animated animate__fadeInUp" style={{ animationDelay: `${index * 70}ms` }} key={habilidade.id}>
              <div className="skill-card-top">
                <div className="skill-icon">✦</div>
                <span>{habilidade.nivel}</span>
              </div>
              <h3>{habilidade.nome}</h3>
              <div className="skill-category">{habilidade.categoria}</div>
              <p>{habilidade.descricao}</p>
              <footer>
                <span>Disponível para <strong>{habilidade.disponibilidade.toLowerCase()}</strong></span>
              </footer>
            </article>
          ))}
        </section>

        <button className="skills-back-button" type="button" onClick={() => onNavigate("inicio")}>← Voltar ao início</button>
      </div>
    </main>
  );
}

export default Habilidades;
