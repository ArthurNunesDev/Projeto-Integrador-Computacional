import { useEffect, useState } from "react";

import Header from "./components/Header.jsx";
import Body from "./components/Body.jsx";
import Configs from "./components/Configs.jsx";
import Oportunidades from "./components/Opportunities.jsx";
import Habilidades from "./components/Skills.jsx";
import Perfil from "./components/Profile.jsx";

import Login from "./auth/Login.jsx";

import "./index.css";
import "./components/Header.css";
import "./components/Body.css";
import "./components/Profile.css";
import "./components/Configs.css";
import "./components/Skills.css";

const CHAVE_TEMA = "marketfaesa-theme";
const CHAVE_CONFIG = "marketfaesa-config";
const CHAVE_AUTENTICACAO = "marketfaesa-auth";
const CHAVE_USUARIOS = "marketfaesa-users";

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

function obterUsuariosLocais() {
  try {
    const salvo = localStorage.getItem(CHAVE_USUARIOS);
    const usuarios = salvo ? JSON.parse(salvo) : [];

    return Array.isArray(usuarios) ? usuarios : [];
  } catch {
    return [];
  }
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
        ? dadosLogin.trim()
        : (dadosLogin?.usuario || dadosLogin?.email || "").trim();

    const senhaInformada =
      typeof dadosLogin === "object"
        ? dadosLogin?.senha || dadosLogin?.password || ""
        : "";

    if (!usuarioInformado || !senhaInformada) {
      return {
        sucesso: false,
        mensagem: "Preencha seu usuário e sua senha.",
      };
    }

    // Em desenvolvimento, também permite as credenciais definidas no .env.development.local.
    const usuarioDev = import.meta.env.VITE_DEV_USER?.trim();
    const senhaDev = import.meta.env.VITE_DEV_PASS;

    if (
      import.meta.env.DEV &&
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
      localStorage.setItem(
        CHAVE_AUTENTICACAO,
        JSON.stringify(usuarioLogado),
      );
      setPagina("inicio");

      return { sucesso: true };
    }

    // Login local: aceita usuário ou e-mail de uma conta criada pelo formulário de cadastro.
    const usuarios = obterUsuariosLocais();
    const encontrado = usuarios.find(
      (conta) =>
        (conta.usuario?.toLowerCase() === usuarioInformado.toLowerCase() ||
          conta.email?.toLowerCase() === usuarioInformado.toLowerCase()) &&
        conta.senha === senhaInformada,
    );

    if (!encontrado) {
      return {
        sucesso: false,
        mensagem: "Usuário ou senha inválidos.",
      };
    }

    const usuarioLogado = {
      usuario: encontrado.usuario,
      nome: encontrado.nome,
      email: encontrado.email,
    };

    setUsuario(usuarioLogado);
    localStorage.setItem(CHAVE_AUTENTICACAO, JSON.stringify(usuarioLogado));
    setPagina("inicio");

    return { sucesso: true };
  }

  function fazerCadastro(dadosCadastro) {
    const nome = dadosCadastro?.nome?.trim() || "";
    const email = dadosCadastro?.email?.trim().toLowerCase() || "";
    const senha = dadosCadastro?.senha || "";

    if (!nome || !email || !senha) {
      return {
        sucesso: false,
        mensagem: "Preencha todos os campos.",
      };
    }

    const usuarios = obterUsuariosLocais();

    if (usuarios.some((conta) => conta.email?.toLowerCase() === email)) {
      return {
        sucesso: false,
        mensagem: "Este e-mail já está cadastrado.",
      };
    }

    const novoUsuario = {
      usuario: email,
      nome,
      email,
      senha,
    };

    const usuariosAtualizados = [...usuarios, novoUsuario];
    localStorage.setItem(
      CHAVE_USUARIOS,
      JSON.stringify(usuariosAtualizados),
    );

    const usuarioLogado = {
      usuario: novoUsuario.usuario,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
    };

    setUsuario(usuarioLogado);
    localStorage.setItem(
      CHAVE_AUTENTICACAO,
      JSON.stringify(usuarioLogado),
    );
    setPagina("inicio");

    return { sucesso: true };
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
      case "oportunidades":
        return <Oportunidades />;

      case "habilidades":
        return <Habilidades onNavigate={navegarPara} />;

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
        return <Body onNavigate={navegarPara} />;
    }
  }

  if (!usuario) {
    return (
      <div className="app">
        <Login onLogin={fazerLogin} onRegister={fazerCadastro} />
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
