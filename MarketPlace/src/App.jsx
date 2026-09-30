import { useEffect, useState } from "react";

import Header from "./components/Header.jsx";
import Body from "./components/Body.jsx";
import Configs from "./components/Configs.jsx";
import Perfil from "./components/Profile.jsx";

import Login from "./auth/Login.jsx";

import "./index.css";
import "./components/Header.css";
import "./components/Body.css";
import "./components/Profile.css";
import "./components/Configs.css";

const CHAVE_TEMA = "marketfaesa-theme";
const CHAVE_CONFIG = "marketfaesa-config";
const CHAVE_AUTENTICACAO = "marketfaesa-auth";

function obterTemaInicial() {
  const temaSalvo = localStorage.getItem(CHAVE_TEMA);

  return temaSalvo === "dark" ? "dark" : "light";
}

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

function obterConfiguracoesIniciais() {
  try {
    const salvo = localStorage.getItem(CHAVE_CONFIG);

    if (salvo) {
      return {
        ...CONFIG_PADRAO,
        ...JSON.parse(salvo),
      };
    }
  } catch {
    // Usa as configurações padrão.
  }

  return CONFIG_PADRAO;
}

function obterUsuarioInicial() {
  try {
    const salvo = localStorage.getItem(CHAVE_AUTENTICACAO);

    if (salvo) {
      return JSON.parse(salvo);
    }
  } catch {
    // Sessão inválida: começa deslogado.
  }

  return null;
}

function App() {
  const [usuario, setUsuario] = useState(obterUsuarioInicial);

  const [pagina, setPagina] = useState("inicio");

  const [tema, setTema] = useState(obterTemaInicial);

  const [configuracoes, setConfiguracoes] = useState(
    obterConfiguracoesIniciais,
  );

  function fazerLogin(dadosLogin) {
    const usuarioInformado =
      typeof dadosLogin === "string"
        ? dadosLogin
        : dadosLogin?.usuario || dadosLogin?.email || "";

    const senhaInformada =
      typeof dadosLogin === "object"
        ? dadosLogin?.senha || dadosLogin?.password || ""
        : "";

    // Login de teste só em `npm run dev`, com credenciais de .env.development.local.
    if (!import.meta.env.DEV) {
      return {
        sucesso: false,
        mensagem: "Login indisponível até a API estar pronta.",
      };
    }

    const usuarioDev = import.meta.env.VITE_DEV_USER;
    const senhaDev = import.meta.env.VITE_DEV_PASS;

    if (
      usuarioDev &&
      senhaDev &&
      usuarioInformado === usuarioDev &&
      senhaInformada === senhaDev
    ) {
      const usuarioLogado = {
        usuario: usuarioInformado,
        nome: "Usuário de teste",
      };

      setUsuario(usuarioLogado);

      localStorage.setItem(CHAVE_AUTENTICACAO, JSON.stringify(usuarioLogado));

      setPagina("inicio");

      return {
        sucesso: true,
      };
    }

    return {
      sucesso: false,
      mensagem: "Usuário ou senha inválidos.",
    };
  }

  function fazerLogout() {
    setUsuario(null);

    localStorage.removeItem(CHAVE_AUTENTICACAO);

    setPagina("inicio");
  }

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);

    localStorage.setItem(CHAVE_TEMA, tema);
  }, [tema]);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-reduzir-animacoes",
      configuracoes.reduzirAnimacoes ? "true" : "false",
    );

    localStorage.setItem(CHAVE_CONFIG, JSON.stringify(configuracoes));
  }, [configuracoes]);

  function alterarTema(novoTema) {
    setTema(novoTema === "dark" ? "dark" : "light");
  }

  function alterarConfiguracao(campo) {
    setConfiguracoes((estado) => ({
      ...estado,
      [campo]: !estado[campo],
    }));
  }

  function navegarPara(novaPagina) {
    setPagina(novaPagina);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function renderizarPagina() {
    switch (pagina) {
      case "perfil":
        return (
          <Perfil
            onNavigate={navegarPara}
            perfilPublico={configuracoes.perfilPublico}
            mostrarEmail={configuracoes.mostrarEmail}
            usuario={usuario}
            onLogout={fazerLogout}
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
          />
        );

      case "inicio":
      default:
        return <Body />;
    }
  }

  if (!usuario) {
    return (
      <div className="app">
        <Login onLogin={fazerLogin} />
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
    </div>
  );
}

export default App;
