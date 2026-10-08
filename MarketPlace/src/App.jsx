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

import { cadastrar, login, sair } from "./api/auth.js";
import { ApiError, definirOnNaoAutenticado, obterToken } from "./api/client.js";
import { obterConfiguracoes, obterMe, salvarConfiguracoes } from "./api/usuarios.js";
import { montarUsuario, salvarPerfilLocal } from "./perfil.js";

import "./index.css";
import "./components/Header.css";
import "./components/Body.css";
import "./components/Profile.css";
import "./components/Configs.css";
import "./components/Skills.css";
import "./components/PeopleSkills.css";
import "./components/Connections.css";
import "./components/Messages.css";
import "./components/Saved.css";
import "./components/Publications.css";
import "./components/Footer.css";

const CHAVE_TEMA = "marketfaesa-theme";
const CHAVE_PAGINA = "marketfaesa-pagina";
const CHAVE_PREFERENCIAS = "marketfaesa-preferencias";

// Chaves de antes da integração com a API: contas com senha em texto puro,
// sessão e configurações locais. São apagadas na primeira carga.
const CHAVES_ANTIGAS = ["marketfaesa-users", "marketfaesa-auth", "marketfaesa-config"];

function limparDadosAntigos() {
  for (const chave of CHAVES_ANTIGAS) {
    try {
      localStorage.removeItem(chave);
    } catch {
      // sem storage não há o que limpar
    }
  }
}

// O tema fica também no navegador só para não piscar na carga; a fonte é a API.
function obterTemaInicial() {
  try {
    return localStorage.getItem(CHAVE_TEMA) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

// Mesmos campos de ConfiguracaoDto (menos o tema): o PUT exige todos.
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

const MENSAGEM_ERRO_PADRAO = "Não foi possível concluir a operação. Tente novamente.";
const MENSAGEM_SESSAO_EXPIRADA = "Sua sessão expirou. Entre novamente.";

function mensagemDoErro(erro, porStatus = {}) {
  if (!(erro instanceof ApiError)) return MENSAGEM_ERRO_PADRAO;
  return porStatus[erro.status] || erro.mensagem || MENSAGEM_ERRO_PADRAO;
}

function App() {
  const [usuario, setUsuario] = useState(null);
  // Com token salvo, a sessão é restaurada via GET /api/usuarios/me antes de mostrar o app.
  const [restaurando, setRestaurando] = useState(() => Boolean(obterToken()));
  const [erroSessao, setErroSessao] = useState("");
  const [avisoLogin, setAvisoLogin] = useState("");
  const [pagina, setPagina] = useState(() => localStorage.getItem(CHAVE_PAGINA) || "inicio");
  const [tema, setTema] = useState(obterTemaInicial);
  const [configuracoes, setConfiguracoes] = useState(CONFIG_PADRAO);
  const [erroConfiguracoes, setErroConfiguracoes] = useState("");
  const [preferencias, setPreferencias] = useState(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_PREFERENCIAS);
      return salvo ? JSON.parse(salvo) : { area: "tecnologia", modalidade: "todas", frequencia: "imediato" };
    } catch {
      return { area: "tecnologia", modalidade: "todas", frequencia: "imediato" };
    }
  });

  useEffect(() => {
    limparDadosAntigos();
  }, []);

  useEffect(() => {
    localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(preferencias));
  }, [preferencias]);

  useEffect(() => {
    localStorage.setItem(CHAVE_TEMA, tema);
    document.documentElement.dataset.theme = tema;
  }, [tema]);

  const encerrarSessao = useCallback((aviso = "") => {
    setUsuario(null);
    setConfiguracoes(CONFIG_PADRAO);
    setErroConfiguracoes("");
    setErroSessao("");
    setAvisoLogin(aviso);
    setPagina("inicio");
    localStorage.setItem(CHAVE_PAGINA, "inicio");
  }, []);

  // Token expirado ou inválido em qualquer requisição: o client já limpou o token.
  useEffect(
    () => definirOnNaoAutenticado(() => encerrarSessao(MENSAGEM_SESSAO_EXPIRADA)),
    [encerrarSessao],
  );

  const carregarConfiguracoes = useCallback(async () => {
    try {
      const { tema: temaSalvo, ...resto } = await obterConfiguracoes();
      setTema(temaSalvo === "dark" ? "dark" : "light");
      setConfiguracoes({ ...CONFIG_PADRAO, ...resto });
      setErroConfiguracoes("");
    } catch (erro) {
      if (erro?.status === 401) return; // o gancho de não autenticado já desloga
      setErroConfiguracoes(`Não foi possível carregar suas configurações. ${mensagemDoErro(erro)}`);
    }
  }, []);

  const entrarComo = useCallback(
    (usuarioApi) => {
      setUsuario(montarUsuario(usuarioApi));
      setErroSessao("");
      setAvisoLogin("");
      carregarConfiguracoes();
    },
    [carregarConfiguracoes],
  );

  useEffect(() => {
    if (!restaurando) return undefined;

    let cancelado = false;
    obterMe()
      .then((usuarioApi) => {
        if (!cancelado) entrarComo(usuarioApi);
      })
      .catch((erro) => {
        // 401: o gancho de não autenticado já voltou para o login.
        if (!cancelado && erro?.status !== 401) setErroSessao(mensagemDoErro(erro));
      })
      .finally(() => {
        if (!cancelado) setRestaurando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [restaurando, entrarComo]);

  async function fazerLogin({ email, senha }) {
    try {
      const resposta = await login({ email, senha });
      entrarComo(resposta.usuario);
      setPagina("inicio");
      localStorage.setItem(CHAVE_PAGINA, "inicio");
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
    sair();
    encerrarSessao();
  }

  function sairDaSessaoComErro() {
    sair();
    setErroSessao("");
  }

  function tentarRestaurarDeNovo() {
    setErroSessao("");
    setRestaurando(true);
  }

  // Campos do perfil sem rota na API: ficam no navegador (ver src/perfil.js).
  function atualizarUsuario(dadosAtualizados) {
    if (!usuario) return;
    const aplicados = salvarPerfilLocal(usuario.id, dadosAtualizados);
    setUsuario((atual) => ({ ...atual, ...aplicados }));
    window.dispatchEvent(new Event("marketfaesa-perfil-atualizado"));
  }

  function alterarPreferencia(campo, valor) {
    setPreferencias((estado) => ({ ...estado, [campo]: valor }));
  }

  // Atualiza na hora e envia a configuração completa; se a API recusar, desfaz.
  function persistirConfiguracoes(novoTema, novasConfiguracoes) {
    const temaAnterior = tema;
    const configuracoesAnteriores = configuracoes;
    setTema(novoTema);
    setConfiguracoes(novasConfiguracoes);
    setErroConfiguracoes("");

    salvarConfiguracoes({ tema: novoTema, ...novasConfiguracoes }).catch((erro) => {
      if (erro?.status === 401) return; // o gancho de não autenticado já desloga
      setTema(temaAnterior);
      setConfiguracoes(configuracoesAnteriores);
      setErroConfiguracoes(`Não foi possível salvar. ${mensagemDoErro(erro)}`);
    });
  }

  function alterarTema(novoTema) {
    persistirConfiguracoes(novoTema === "dark" ? "dark" : "light", configuracoes);
  }

  function alterarConfiguracao(campo) {
    persistirConfiguracoes(tema, { ...configuracoes, [campo]: !configuracoes[campo] });
  }

  function navegarPara(novaPagina) {
    setPagina(novaPagina);
    localStorage.setItem(CHAVE_PAGINA, novaPagina);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function renderizarPagina() {
    switch (pagina) {
      case "oportunidades":
        return <Oportunidades />;

      case "habilidades":
        return <PeopleSkills onNavigate={navegarPara} />;

      case "conexoes":
        return <Connections onNavigate={navegarPara} />;

      case "mensagens":
        return <Messages />;

      case "salvos":
        return <Salvos onNavigate={navegarPara} />;

      case "publicacoes":
        return <MinhasPublicacoes onNavigate={navegarPara} />;

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
            preferencias={preferencias}
            onAlterarPreferencia={alterarPreferencia}
            usuario={usuario}
            onLogout={fazerLogout}
            onUpdateUsuario={atualizarUsuario}
          />
        );

      case "publicar-habilidade":
        return <Habilidades onNavigate={navegarPara} />;

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
        usuario={usuario}
        onLogout={fazerLogout}
      />

      {renderizarPagina()}
      <Footer onNavigate={navegarPara} />
    </div>
  );
}

export default App;
