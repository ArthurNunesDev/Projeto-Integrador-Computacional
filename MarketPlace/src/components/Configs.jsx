import { useState } from "react";

const CONFIG_SECTIONS = [
  {
    id: "conta",
    label: "Conta",
    description: "Informações pessoais",
    icon: "👤",
  },
  {
    id: "seguranca",
    label: "Segurança",
    description: "Senha e acesso",
    icon: "🔒",
  },
  {
    id: "privacidade",
    label: "Privacidade",
    description: "Controle sua visibilidade",
    icon: "◉",
  },
  {
    id: "notificacoes",
    label: "Notificações",
    description: "Alertas e mensagens",
    icon: "🔔",
  },
  {
    id: "aparencia",
    label: "Aparência",
    description: "Visual do aplicativo",
    icon: "◐",
  },
  {
    id: "preferencias",
    label: "Preferências",
    description: "Personalize sua experiência",
    icon: "⚙",
  },
  {
    id: "telas-login",
    label: "Telas de Login",
    description: "Personalize a tela de acesso",
    icon: "✦",
  },
];

function Configs({
  onNavigate,
  tema,
  onChangeTema,
  configuracoes,
  onAlterarConfiguracao,
  configuracoesLogin,
  onAlterarConfiguracaoLogin,
}) {
  const [secaoAtiva, setSecaoAtiva] = useState("conta");

  const [salvo, setSalvo] = useState(false);

  /*
   * TEMA
   *
   * O estado e a aplicação do tema vivem em App.jsx (raiz do
   * app), pra funcionar em qualquer página, não só nesta.
   * Aqui só repassamos a escolha do usuário pra cima.
   */

  function alterarTema(novoTema) {
    onChangeTema(novoTema);
    setSalvo(false);
  }

  /*
   * CONFIGURAÇÕES
   *
   * Mesma ideia: o estado vive em App.jsx, pra Perfil e outras
   * páginas também poderem ler (e-mail visível, animações etc).
   */

  function alterarConfiguracao(campo) {
    onAlterarConfiguracao(campo);
    setSalvo(false);
  }

  function salvarConfiguracoes() {
    setSalvo(true);

    window.setTimeout(() => {
      setSalvo(false);
    }, 2500);
  }

  function renderizarConteudo() {
    switch (secaoAtiva) {
      case "conta":
        return (
          <section className="configs-content-card animate__animated animate__fadeIn">
            <ConfigHeader
              eyebrow="CONTA"
              title="Informações da conta"
              description="Gerencie suas informações pessoais do MarketFaesa."
            />

            <div className="configs-form-grid">
              <ConfigField label="Nome completo" value="João Silva" />

              <ConfigField label="E-mail" value="joao.silva@faesa.br" />

              <ConfigField label="Curso" value="Ciência da Computação" />

              <ConfigField label="Período" value="4º período" />
            </div>

            <ConfigDivider />

            <div className="configs-danger-zone">
              <div>
                <strong>Excluir conta</strong>

                <p>
                  Esta ação é permanente e removerá seus dados da plataforma.
                </p>
              </div>

              <button type="button" className="configs-danger-button">
                Excluir conta
              </button>
            </div>
          </section>
        );

      case "seguranca":
        return (
          <section className="configs-content-card animate__animated animate__fadeIn">
            <ConfigHeader
              eyebrow="SEGURANÇA"
              title="Segurança e acesso"
              description="Mantenha sua conta protegida."
            />

            <div className="configs-security-list">
              <ConfigAction
                icon="🔑"
                title="Alterar senha"
                description="Atualize sua senha de acesso."
                button="Alterar"
              />

              <ConfigAction
                icon="📱"
                title="Sessões ativas"
                description="Veja onde sua conta está conectada."
                button="Gerenciar"
              />

              <ConfigAction
                icon="🛡"
                title="Verificação em duas etapas"
                description="Adicione uma camada extra de segurança."
                button="Configurar"
              />
            </div>
          </section>
        );

      case "privacidade":
        return (
          <section className="configs-content-card animate__animated animate__fadeIn">
            <ConfigHeader
              eyebrow="PRIVACIDADE"
              title="Privacidade"
              description="Escolha o que outros estudantes podem visualizar."
            />

            <div className="configs-options">
              <ConfigToggle
                title="Perfil público"
                description="Permite que outros estudantes encontrem seu perfil."
                checked={configuracoes.perfilPublico}
                onChange={() => alterarConfiguracao("perfilPublico")}
              />

              <ConfigToggle
                title="Exibir e-mail"
                description="Mostra seu e-mail na página pública do perfil."
                checked={configuracoes.mostrarEmail}
                onChange={() => alterarConfiguracao("mostrarEmail")}
              />

              <ConfigToggle
                title="Permitir mensagens"
                description="Outros estudantes poderão iniciar uma conversa."
                checked={configuracoes.permitirMensagens}
                onChange={() => alterarConfiguracao("permitirMensagens")}
              />
            </div>
          </section>
        );

      case "notificacoes":
        return (
          <section className="configs-content-card animate__animated animate__fadeIn">
            <ConfigHeader
              eyebrow="NOTIFICAÇÕES"
              title="Notificações"
              description="Escolha quais atualizações deseja receber."
            />

            <div className="configs-options">
              <ConfigToggle
                title="Novas oportunidades"
                description="Receba avisos sobre oportunidades compatíveis com você."
                checked={configuracoes.novasOportunidades}
                onChange={() => alterarConfiguracao("novasOportunidades")}
              />

              <ConfigToggle
                title="Mensagens"
                description="Seja avisado quando receber uma nova mensagem."
                checked={configuracoes.mensagens}
                onChange={() => alterarConfiguracao("mensagens")}
              />

              <ConfigToggle
                title="Novas conexões"
                description="Receba avisos sobre solicitações e conexões."
                checked={configuracoes.conexoes}
                onChange={() => alterarConfiguracao("conexoes")}
              />

              <ConfigToggle
                title="Publicações"
                description="Receba atualizações relacionadas às suas publicações."
                checked={configuracoes.publicacoes}
                onChange={() => alterarConfiguracao("publicacoes")}
              />

              <ConfigToggle
                title="Resumo semanal"
                description="Receba um resumo semanal das atividades relevantes."
                checked={configuracoes.resumoSemanal}
                onChange={() => alterarConfiguracao("resumoSemanal")}
              />
            </div>
          </section>
        );

      case "aparencia":
        return (
          <section className="configs-content-card animate__animated animate__fadeIn">
            <ConfigHeader
              eyebrow="APARÊNCIA"
              title="Aparência"
              description="Personalize a forma como o MarketFaesa é exibido."
            />

            <div className="configs-theme-grid">
              <button
                className={`configs-theme-option ${
                  tema === "light" ? "ativo" : ""
                }`}
                type="button"
                onClick={() => alterarTema("light")}
                aria-pressed={tema === "light"}
              >
                <span className="configs-theme-preview light">Aa</span>

                <span>Claro</span>

                <small>{tema === "light" ? "Tema atual" : "Tema claro"}</small>
              </button>

              <button
                className={`configs-theme-option ${
                  tema === "dark" ? "ativo" : ""
                }`}
                type="button"
                onClick={() => alterarTema("dark")}
                aria-pressed={tema === "dark"}
              >
                <span className="configs-theme-preview dark">Aa</span>

                <span>Escuro</span>

                <small>{tema === "dark" ? "Tema atual" : "Tema escuro"}</small>
              </button>
            </div>

            <ConfigDivider />

            <ConfigToggle
              title="Reduzir animações"
              description="Diminui os efeitos de movimento da interface."
              checked={configuracoes.reduzirAnimacoes}
              onChange={() => alterarConfiguracao("reduzirAnimacoes")}
            />
          </section>
        );

      case "telas-login":
        return (
          <section className="configs-content-card animate__animated animate__fadeIn">
            <ConfigHeader
              eyebrow="TELAS DE LOGIN"
              title="Personalização da tela de login"
              description="Escolha como a tela de acesso do MarketFaesa será apresentada."
            />

            <div className="login-config-section">
              <div className="login-config-group">
                <div className="login-config-group-header">
                  <span className="login-config-icon">🐾</span>
                  <div>
                    <strong>Pet</strong>
                    <p>Escolha o personagem exibido na tela de login.</p>
                  </div>
                </div>

                <div className="login-config-options">
                  <button
                    type="button"
                    className={`login-config-option ${configuracoesLogin?.pet === "glutao" ? "ativo" : ""}`}
                    onClick={() => onAlterarConfiguracaoLogin("pet", "glutao")}
                  >
                    <span className="login-config-preview">🐾</span>
                    <strong>Glutão</strong>
                    <small>Pet atual</small>
                  </button>

                  <button
                    type="button"
                    className={`login-config-option ${configuracoesLogin?.pet === "nenhum" ? "ativo" : ""}`}
                    onClick={() => onAlterarConfiguracaoLogin("pet", "nenhum")}
                  >
                    <span className="login-config-preview">○</span>
                    <strong>Nenhum</strong>
                    <small>Sem pet</small>
                  </button>
                </div>
              </div>

              <div className="login-config-divider" />

              <div className="login-config-group">
                <div className="login-config-group-header">
                  <span className="login-config-icon">◈</span>
                  <div>
                    <strong>Estilo da tela</strong>
                    <p>Defina o estilo visual do login.</p>
                  </div>
                </div>

                <div className="login-config-options">
                  <button
                    type="button"
                    className={`login-config-option ${configuracoesLogin?.estilo === "padrao" ? "ativo" : ""}`}
                    onClick={() => onAlterarConfiguracaoLogin("estilo", "padrao")}
                  >
                    <span className="login-style-preview login-style-padrao">Aa</span>
                    <strong>Padrão</strong>
                    <small>Visual atual</small>
                  </button>

                  <button
                    type="button"
                    className={`login-config-option ${configuracoesLogin?.estilo === "neon" ? "ativo" : ""}`}
                    onClick={() => onAlterarConfiguracaoLogin("estilo", "neon")}
                  >
                    <span className="login-style-preview login-style-neon">✦</span>
                    <strong>Neon</strong>
                    <small>Visual luminoso</small>
                  </button>
                </div>
              </div>

              <div className="login-config-divider" />

              <ConfigToggle
                title="Partículas"
                description="Exibe as partículas interativas da tela de login."
                checked={configuracoesLogin?.particulas ?? true}
                onChange={() =>
                  onAlterarConfiguracaoLogin(
                    "particulas",
                    !(configuracoesLogin?.particulas ?? true),
                  )
                }
              />

              <ConfigToggle
                title="Animações"
                description="Ativa as animações e transições da tela de login."
                checked={configuracoesLogin?.animacoes ?? true}
                onChange={() =>
                  onAlterarConfiguracaoLogin(
                    "animacoes",
                    !(configuracoesLogin?.animacoes ?? true),
                  )
                }
              />
            </div>
          </section>
        );

      case "preferencias":
        return (
          <section className="configs-content-card animate__animated animate__fadeIn">
            <ConfigHeader
              eyebrow="PREFERÊNCIAS"
              title="Preferências"
              description="Personalize o conteúdo que aparece para você."
            />

            <div className="configs-select-list">
              <label className="configs-select-field">
                <span>Área principal de interesse</span>

                <select defaultValue="tecnologia">
                  <option value="tecnologia">Tecnologia</option>

                  <option value="design">Design</option>

                  <option value="engenharia">Engenharia</option>

                  <option value="saude">Saúde</option>

                  <option value="direito">Direito</option>

                  <option value="administracao">Administração</option>
                </select>
              </label>

              <label className="configs-select-field">
                <span>Modalidade preferida</span>

                <select defaultValue="todas">
                  <option value="todas">Todas</option>

                  <option value="remoto">Remoto</option>

                  <option value="presencial">Presencial</option>

                  <option value="hibrido">Híbrido</option>
                </select>
              </label>

              <label className="configs-select-field">
                <span>Frequência dos avisos</span>

                <select defaultValue="imediato">
                  <option value="imediato">Imediatamente</option>

                  <option value="diario">Resumo diário</option>

                  <option value="semanal">Resumo semanal</option>
                </select>
              </label>
            </div>
          </section>
        );

      default:
        return null;
    }
  }

  return (
    <main className="configs-page">
      <div className="configs-container">
        <header className="configs-page-header animate__animated animate__fadeInDown">
          <div>
            <span>PREFERÊNCIAS DA CONTA</span>

            <h1>Configurações</h1>

            <p>
              Gerencie sua conta, privacidade, notificações e preferências do
              MarketFaesa.
            </p>
          </div>

          <button
            type="button"
            className="configs-back-button"
            onClick={() => onNavigate("inicio")}
          >
            ← Voltar ao início
          </button>
        </header>

        <div className="configs-layout">
          {/* MENU */}

          <aside
            className="
              configs-sidebar
              animate__animated
              animate__fadeInLeft
            "
          >
            <span className="configs-sidebar-title">CONFIGURAÇÕES</span>

            <nav>
              {CONFIG_SECTIONS.map((section) => (
                <button
                  type="button"
                  key={section.id}
                  className={`configs-nav-item ${
                    secaoAtiva === section.id ? "ativo" : ""
                  }`}
                  onClick={() => setSecaoAtiva(section.id)}
                >
                  <span className="configs-nav-icon">{section.icon}</span>

                  <span className="configs-nav-text">
                    <strong>{section.label}</strong>

                    <small>{section.description}</small>
                  </span>

                  <span className="configs-nav-arrow">→</span>
                </button>
              ))}
            </nav>

            <div className="configs-sidebar-help">
              <span>?</span>

              <div>
                <strong>Precisa de ajuda?</strong>

                <p>Entre em contato com nosso suporte.</p>
              </div>
            </div>
          </aside>

          {/* CONTEÚDO */}

          <div className="configs-main">
            {renderizarConteudo()}

            <div className="configs-save-bar">
              <div>
                {salvo ? (
                  <span className="configs-saved">✓ Alterações salvas</span>
                ) : (
                  <span>Algumas alterações podem precisar ser salvas.</span>
                )}
              </div>

              <button
                type="button"
                className="configs-save-button"
                onClick={salvarConfiguracoes}
              >
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ConfigHeader({ eyebrow, title, description }) {
  return (
    <div className="configs-content-header">
      <span>{eyebrow}</span>

      <h2>{title}</h2>

      <p>{description}</p>
    </div>
  );
}

function ConfigDivider() {
  return <div className="configs-divider"></div>;
}

function ConfigField({ label, value }) {
  return (
    <label className="configs-field">
      <span>{label}</span>

      <input type="text" defaultValue={value} />
    </label>
  );
}

function ConfigToggle({ title, description, checked, onChange }) {
  return (
    <div className="configs-toggle-row">
      <div className="configs-toggle-info">
        <strong>{title}</strong>

        <p>{description}</p>
      </div>

      <button
        type="button"
        className={`configs-switch ${checked ? "ativo" : ""}`}
        onClick={onChange}
        role="switch"
        aria-checked={checked}
      >
        <span></span>
      </button>
    </div>
  );
}

function ConfigAction({ icon, title, description, button }) {
  return (
    <div className="configs-action-row">
      <div className="configs-action-icon">{icon}</div>

      <div className="configs-action-info">
        <strong>{title}</strong>

        <p>{description}</p>
      </div>

      <button type="button">{button}</button>
    </div>
  );
}

export default Configs;
