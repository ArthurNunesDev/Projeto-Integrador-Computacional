import { useCallback, useEffect, useState } from "react";

import Header from "./components/Header.jsx";
import Body from "./components/Body.jsx";
import Configs from "./components/Configs.jsx";
import Oportunidades from "./components/Opportunities.jsx";
import Habilidades from "./components/Skills.jsx";
import PeopleSkills from "./components/PeopleSkills.jsx";
import Connections from "./components/Connections.jsx";
import Messages from "./components/Messages.jsx";
import Salvos from "./components/Saved.jsx";
import MinhasPublicacoes from "./components/Publications.jsx";
import Perfil from "./components/Profile.jsx";
import Footer from "./components/Footer.jsx";

import Login from "./auth/Login.jsx";

import { cadastrar, login, obterSessaoLocal, sair } from "./api/auth.js";
import { ApiError } from "./api/client.js";
import { chaveUsuario, lerJsonUsuario, salvarJsonUsuario, lerValorSeguro, salvarValorSeguro } from "./storage.js";
import { montarUsuario, persistirPerfilLocal } from "./perfil.js";

import "./index.scss";
import "./components/Header.scss";
import "./components/Body.scss";
import "./components/Profile.scss";
import "./components/Configs.scss";
import "./components/Skills.scss";
import "./components/PeopleSkills.scss";
import "./components/Connections.scss";
import "./components/Messages.scss";
import "./components/Saved.scss";
import "./components/Publications.scss";
import "./components/Footer.scss";
import "./ResponsiveAudit.scss";

const CHAVE_TEMA = "marketfaesa-theme";
const CHAVE_PAGINA = "marketfaesa-pagina";
const CHAVE_PREFERENCIAS = "marketfaesa-preferencias";
const CHAVE_CONFIGURACOES = "marketfaesa-configuracoes";
const PREFERENCIAS_PADRAO = { area: "tecnologia", modalidade: "todas", frequencia: "imediato" };

function obterTemaInicial(usuarioId) {
  if (usuarioId == null || usuarioId === "") return "light";

  const configuracoesSalvas = lerJsonUsuario(CHAVE_CONFIGURACOES, usuarioId, null);
  if (configuracoesSalvas?.tema === "dark" || configuracoesSalvas?.tema === "light") {
    return configuracoesSalvas.tema;
  }
  try {
    return lerValorSeguro(chaveUsuario(CHAVE_TEMA, usuarioId)) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

// Configurações demonstrativas guardadas separadamente para cada conta.
const CONFIG_PADRAO = {
  perfilPublico: true,
  mostrarEmail: false,
  permitirMensagens: true,
  novasOportunidades: true,
  mensagens: true,
  conexoes: true,
  publicacoes: true,
  resumoSemanal: false,
  reduzirAnimacoes: false,
};

const VALORES_PREFERENCIAS = {
  area: ["tecnologia", "design", "engenharia", "saude", "direito", "administracao"],
  modalidade: ["todas", "remoto", "presencial", "hibrido"],
  frequencia: ["imediato", "diario", "semanal"],
};

function normalizarConfiguracoes(dados) {
  const origem = dados && typeof dados === "object" && !Array.isArray(dados) ? dados : {};
  return Object.fromEntries(
    Object.entries(CONFIG_PADRAO).map(([campo, padrao]) => [
      campo,
      typeof origem[campo] === "boolean" ? origem[campo] : padrao,
    ]),
  );
}

function normalizarPreferencias(dados) {
  const origem = dados && typeof dados === "object" && !Array.isArray(dados) ? dados : {};
  return Object.fromEntries(
    Object.entries(PREFERENCIAS_PADRAO).map(([campo, padrao]) => [
      campo,
      VALORES_PREFERENCIAS[campo].includes(origem[campo]) ? origem[campo] : padrao,
    ]),
  );
}

const MENSAGEM_ERRO_PADRAO = "Não foi possível concluir a operação. Tente novamente.";

function mensagemDoErro(erro, porStatus = {}) {
  if (!(erro instanceof ApiError)) return MENSAGEM_ERRO_PADRAO;
  return porStatus[erro.status] || erro.mensagem || MENSAGEM_ERRO_PADRAO;
}

function App() {
  const [usuario, setUsuario] = useState(() => {
    const sessao = obterSessaoLocal();
    return sessao ? montarUsuario(sessao) : null;
  });
  // A sessão demonstrativa é restaurada diretamente do localStorage, sem backend.
  const [restaurando, setRestaurando] = useState(false);
  const [erroSessao, setErroSessao] = useState("");
  const [avisoLogin, setAvisoLogin] = useState("");
  const [buscaInicialOportunidades, setBuscaInicialOportunidades] = useState("");
  const [pagina, setPagina] = useState(() => {
    const sessao = obterSessaoLocal();
    try {
      return lerValorSeguro(chaveUsuario(CHAVE_PAGINA, sessao?.id)) || "inicio";
    } catch {
      return "inicio";
    }
  });
  const [tema, setTema] = useState(() => obterTemaInicial(obterSessaoLocal()?.id));
  const [configuracoes, setConfiguracoes] = useState(() => {
    const sessao = obterSessaoLocal();
    if (!sessao?.id) return { ...CONFIG_PADRAO };

    const salvo = lerJsonUsuario(CHAVE_CONFIGURACOES, sessao.id, {});
    const origem = salvo && typeof salvo === "object" && !Array.isArray(salvo) ? salvo : {};
    return normalizarConfiguracoes(origem);
  });
  const [configuracoesCarregadas, setConfiguracoesCarregadas] = useState(true);
  const [erroCarregarConfiguracoes, setErroCarregarConfiguracoes] = useState("");
  const [erroConfiguracoes, setErroConfiguracoes] = useState("");
  const [preferencias, setPreferencias] = useState(() => {
    const sessao = obterSessaoLocal();
    return sessao?.id
      ? normalizarPreferencias(lerJsonUsuario(CHAVE_PREFERENCIAS, sessao.id, PREFERENCIAS_PADRAO))
      : { ...PREFERENCIAS_PADRAO };
  });

  useEffect(() => {
    if (!usuario?.id) {
      document.documentElement.dataset.theme = "light";
      return;
    }

    try {
      salvarValorSeguro(chaveUsuario(CHAVE_TEMA, usuario.id), tema);
    } catch {
      // A interface continua funcionando se o navegador bloquear o armazenamento.
    }
    document.documentElement.dataset.theme = tema;
  }, [tema, usuario?.id]);

  const carregarConfiguracoes = useCallback((usuarioId) => {
    const salvo = lerJsonUsuario(CHAVE_CONFIGURACOES, usuarioId, {});
    const { tema: temaSalvo, ...resto } = salvo && typeof salvo === "object" && !Array.isArray(salvo) ? salvo : {};
    setTema(temaSalvo === "dark" || temaSalvo === "light" ? temaSalvo : obterTemaInicial(usuarioId));
    setConfiguracoes(normalizarConfiguracoes(resto));
    setConfiguracoesCarregadas(true);
    setErroCarregarConfiguracoes("");
    setErroConfiguracoes("");
  }, []);

  const entrarComo = useCallback(
    (usuarioApi) => {
      setUsuario(montarUsuario(usuarioApi));
      setErroSessao("");
      setAvisoLogin("");
      setPagina("inicio");
      try {
        salvarValorSeguro(chaveUsuario(CHAVE_PAGINA, usuarioApi.id), "inicio");
      } catch {
        // A navegação inicial funciona mesmo sem persistência local.
      }
      setPreferencias(normalizarPreferencias(lerJsonUsuario(CHAVE_PREFERENCIAS, usuarioApi.id, PREFERENCIAS_PADRAO)));
      carregarConfiguracoes(usuarioApi.id);
    },
    [carregarConfiguracoes],
  );

  const encerrarSessao = useCallback((aviso = "") => {
    setUsuario(null);
    setErroSessao("");
    setAvisoLogin(aviso);
    setPagina("inicio");
    setTema("light");
    setConfiguracoes(CONFIG_PADRAO);
    setConfiguracoesCarregadas(true);
    setErroCarregarConfiguracoes("");
    setErroConfiguracoes("");
    setPreferencias(PREFERENCIAS_PADRAO);
  }, []);


  async function fazerLogin({ email, senha }) {
    try {
      const resposta = await login({ email, senha });
      entrarComo(resposta.usuario);
      setPagina("inicio");
      try {
        salvarValorSeguro(chaveUsuario(CHAVE_PAGINA, resposta.usuario.id), "inicio");
      } catch {
        // O login não deve falhar apenas porque a página não pôde ser persistida.
      }
      return { sucesso: true };
    } catch (erro) {
      return { sucesso: false, mensagem: mensagemDoErro(erro, { 401: "E-mail ou senha inválidos." }) };
    }
  }

  async function fazerCadastro({ nome, email, senha }) {
    try {
      await cadastrar({ nome, email, senha });
    } catch (erro) {
      if (erro?.status === 409) {
        return { sucesso: false, mensagem: "Este e-mail já está cadastrado." };
      }
      return { sucesso: false, mensagem: mensagemDoErro(erro), campos: erro?.campos || null };
    }

    const resultado = await fazerLogin({ email, senha });
    if (!resultado.sucesso) {
      return {
        sucesso: false,
        contaCriada: true,
        mensagem: `Conta criada, mas não foi possível entrar: ${resultado.mensagem}`,
      };
    }
    return resultado;
  }

  function fazerLogout() {
    if (usuario) {
      try {
        salvarValorSeguro(chaveUsuario(CHAVE_PAGINA, usuario.id), "inicio");
      } catch {
        // O logout deve continuar mesmo se o navegador bloquear o armazenamento.
      }
    }
    sair();
    encerrarSessao();
  }

  function sairDaSessaoComErro() {
    sair();
    setErroSessao("");
    setTema("light");
  }

  function tentarRestaurarDeNovo() {
    setErroSessao("");
    setRestaurando(true);
  }

  // Campos do perfil sem rota na API: ficam no navegador (ver src/perfil.js).
  function atualizarUsuario(dadosAtualizados) {
    if (!usuario?.id) return false;
    const resultado = persistirPerfilLocal(usuario.id, dadosAtualizados);
    if (!resultado.sucesso) return false;
    setUsuario((atual) => ({ ...atual, ...resultado.aplicados }));
    window.dispatchEvent(new Event("marketfaesa-perfil-atualizado"));
    return true;
  }

  function alterarPreferencia(campo, valor) {
    if (!usuario?.id) return false;
    const novasPreferencias = { ...preferencias, [campo]: valor };
    if (!salvarJsonUsuario(CHAVE_PREFERENCIAS, usuario.id, novasPreferencias)) return false;
    setPreferencias(novasPreferencias);
    return true;
  }

  function persistirConfiguracoes(novoTema, novasConfiguracoes) {
    if (!usuario?.id) return false;
    const temaNormalizado = novoTema === "dark" ? "dark" : "light";
    const sucesso = salvarJsonUsuario(CHAVE_CONFIGURACOES, usuario.id, {
      tema: temaNormalizado,
      ...novasConfiguracoes,
    });
    if (!sucesso) return false;
    setTema(temaNormalizado);
    setConfiguracoes(novasConfiguracoes);
    setConfiguracoesCarregadas(true);
    setErroConfiguracoes("");
    setErroCarregarConfiguracoes("");
    return true;
  }

  function recarregarConfiguracoes() {
    if (usuario) carregarConfiguracoes(usuario.id);
  }

  function alterarTema(novoTema) {
    return persistirConfiguracoes(novoTema === "dark" ? "dark" : "light", configuracoes);
  }

  function alterarConfiguracao(campo) {
    return persistirConfiguracoes(tema, { ...configuracoes, [campo]: !configuracoes[campo] });
  }

  function navegarPara(novaPagina) {
    setPagina(novaPagina);
    if (usuario?.id) {
      try {
        salvarValorSeguro(chaveUsuario(CHAVE_PAGINA, usuario.id), novaPagina);
      } catch {
        // A navegação deve funcionar mesmo sem persistência local.
      }
    }

    const reduzirMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: reduzirMovimento ? "auto" : "smooth",
    });
  }

  function buscarOportunidades(termo) {
    setBuscaInicialOportunidades(termo);
    navegarPara("oportunidades");
  }

  function renderizarPagina() {
    switch (pagina) {
      case "oportunidades":
        return (
          <Oportunidades
            key={buscaInicialOportunidades}
            usuarioId={usuario?.id}
            initialSearch={buscaInicialOportunidades}
          />
        );

      case "habilidades":
        return <PeopleSkills onNavigate={navegarPara} usuarioId={usuario?.id} />;

      case "conexoes":
        return <Connections onNavigate={navegarPara} usuarioId={usuario?.id} />;

      case "mensagens":
        return <Messages usuarioId={usuario?.id} />;

      case "salvos":
        return <Salvos onNavigate={navegarPara} usuarioId={usuario?.id} />;

      case "publicacoes":
        return <MinhasPublicacoes onNavigate={navegarPara} usuarioId={usuario?.id} />;

      case "perfil":
        return (
          <Perfil
            onNavigate={navegarPara}
            perfilPublico={configuracoes.perfilPublico}
            mostrarEmail={configuracoes.mostrarEmail}
            usuario={usuario}
            onUpdateUsuario={atualizarUsuario}
          />
        );

      case "configuracoes":
        return (
          <Configs
            onNavigate={navegarPara}
            tema={tema}
            onChangeTema={alterarTema}
            configuracoes={configuracoes}
            onAlterarConfiguracao={alterarConfiguracao}
            erroConfiguracoes={erroConfiguracoes}
            configuracoesCarregadas={configuracoesCarregadas}
            erroCarregarConfiguracoes={erroCarregarConfiguracoes}
            onRecarregarConfiguracoes={recarregarConfiguracoes}
            preferencias={preferencias}
            onAlterarPreferencia={alterarPreferencia}
            usuario={usuario}
            onLogout={fazerLogout}
            onUpdateUsuario={atualizarUsuario}
          />
        );

      case "publicar-habilidade":
        return <Habilidades onNavigate={navegarPara} usuarioId={usuario?.id} usuario={usuario} />;

      case "inicio":
      default:
        return <Body onNavigate={navegarPara} usuario={usuario} />;
    }
  }

  if (!usuario && restaurando) {
    return (
      <div className="app">
        <main className="login-page">
          <div className="login-card">
            <p role="status">Carregando sua sessão...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!usuario && erroSessao) {
    return (
      <div className="app">
        <main className="login-page">
          <div className="login-card login-form">
            <div className="login-error" role="alert">
              Não foi possível carregar sua sessão. {erroSessao}
            </div>
            <button type="button" className="login-submit" onClick={tentarRestaurarDeNovo}>
              Tentar novamente
            </button>
            <p className="login-switch">
              <button type="button" onClick={sairDaSessaoComErro}>
                Sair e entrar com outra conta
              </button>
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="app">
        <Login onLogin={fazerLogin} onRegister={fazerCadastro} aviso={avisoLogin} />
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        paginaAtual={pagina}
        onNavigate={navegarPara}
        onSearch={buscarOportunidades}
        usuario={usuario}
        onLogout={fazerLogout}
      />

      {renderizarPagina()}
      {pagina === "inicio" && <Footer onNavigate={navegarPara} />}
    </div>
  );
}

export default App;
