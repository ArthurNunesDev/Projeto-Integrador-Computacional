import { useEffect, useState } from "react";

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
const CHAVE_CONFIG = "marketfaesa-config";
const CHAVE_AUTENTICACAO = "marketfaesa-auth";
const CHAVE_USUARIOS = "marketfaesa-users";
const CHAVE_PAGINA = "marketfaesa-pagina";
const CHAVE_PERFIL = "marketfaesa-perfil";
const CHAVE_PREFERENCIAS = "marketfaesa-preferencias";

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
  const [pagina, setPagina] = useState(() => localStorage.getItem(CHAVE_PAGINA) || "inicio");
  const [tema, setTema] = useState(obterTemaInicial);
  const [configuracoes, setConfiguracoes] = useState(obterConfiguracoesIniciais);
  const [preferencias, setPreferencias] = useState(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_PREFERENCIAS);
      return salvo ? JSON.parse(salvo) : { area: "tecnologia", modalidade: "todas", frequencia: "imediato" };
    } catch {
      return { area: "tecnologia", modalidade: "todas", frequencia: "imediato" };
    }
  });

  useEffect(() => {
    localStorage.setItem(CHAVE_CONFIG, JSON.stringify(configuracoes));
  }, [configuracoes]);

  useEffect(() => {
    localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(preferencias));
  }, [preferencias]);

  useEffect(() => {
    localStorage.setItem(CHAVE_TEMA, tema);
    document.documentElement.dataset.theme = tema;
  }, [tema]);

  function fazerLogin(dadosLogin) {
    const usuarioInformado =
      typeof dadosLogin === "string"
        ? dadosLogin.trim()
        : (dadosLogin?.usuario || dadosLogin?.email || "").trim();

    const emailInformado =
      typeof dadosLogin === "object"
        ? (dadosLogin?.email || "").trim().toLowerCase()
        : "";

    const senhaInformada =
      typeof dadosLogin === "object"
        ? dadosLogin?.senha || dadosLogin?.password || ""
        : "";

    if (!usuarioInformado || !emailInformado || !senhaInformada) {
      return {
        sucesso: false,
        mensagem: "Preencha seu usuário, e-mail e senha.",
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
        nome: usuarioInformado,
        email: emailInformado,
      };

      localStorage.setItem(
        `${CHAVE_PERFIL}:${emailInformado}`,
        JSON.stringify({ nome: usuarioLogado.nome, email: usuarioLogado.email }),
      );

      setUsuario(usuarioLogado);
      localStorage.setItem(
        CHAVE_AUTENTICACAO,
        JSON.stringify(usuarioLogado),
      );
      setPagina("inicio");
      localStorage.setItem(CHAVE_PAGINA, "inicio");

      return { sucesso: true };
    }

    // Login local: aceita usuário ou e-mail de uma conta criada pelo formulário de cadastro.
    const usuarios = obterUsuariosLocais();
    const encontrado = usuarios.find(
      (conta) =>
        conta.usuario?.toLowerCase() === usuarioInformado.toLowerCase() &&
        conta.email?.toLowerCase() === emailInformado &&
        conta.senha === senhaInformada,
    );

    if (!encontrado) {
      return {
        sucesso: false,
        mensagem: "Usuário ou senha inválidos.",
      };
    }

    const chavePerfilUsuario = `${CHAVE_PERFIL}:${encontrado.email.toLowerCase()}`;
    let perfilSalvo = {};
    try {
      perfilSalvo = JSON.parse(localStorage.getItem(chavePerfilUsuario) || "{}");
    } catch {}

    const usuarioLogado = {
      usuario: encontrado.usuario,
      nome: encontrado.nome,
      email: encontrado.email,
      curso: perfilSalvo.curso || "Ciência da Computação",
      periodo: perfilSalvo.periodo || "4º período",
      cidade: perfilSalvo.cidade || "Vitória, ES",
    };

    localStorage.setItem(
      chavePerfilUsuario,
      JSON.stringify({
        ...perfilSalvo,
        nome: encontrado.nome,
        email: encontrado.email,
      }),
    );

    setUsuario(usuarioLogado);
    localStorage.setItem(CHAVE_AUTENTICACAO, JSON.stringify(usuarioLogado));
    setPagina("inicio");
    localStorage.setItem(CHAVE_PAGINA, "inicio");

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

    localStorage.setItem(
      `${CHAVE_PERFIL}:${email}`,
      JSON.stringify({ nome, email }),
    );

    setUsuario(usuarioLogado);
    localStorage.setItem(
      CHAVE_AUTENTICACAO,
      JSON.stringify(usuarioLogado),
    );
    setPagina("inicio");

    return { sucesso: true };
  }

  function atualizarUsuario(dadosAtualizados) {
    const usuarioAtualizado = { ...usuario, ...dadosAtualizados };
    setUsuario(usuarioAtualizado);
    localStorage.setItem(CHAVE_AUTENTICACAO, JSON.stringify(usuarioAtualizado));

    const chavePerfilUsuario = usuarioAtualizado?.email
      ? `${CHAVE_PERFIL}:${usuarioAtualizado.email.toLowerCase()}`
      : CHAVE_PERFIL;

    try {
      const perfilAtual = JSON.parse(localStorage.getItem(chavePerfilUsuario) || "{}");
      localStorage.setItem(
        chavePerfilUsuario,
        JSON.stringify({ ...perfilAtual, ...dadosAtualizados }),
      );
    } catch {
      localStorage.setItem(chavePerfilUsuario, JSON.stringify(dadosAtualizados));
    }

    const usuarios = obterUsuariosLocais();
    const emailAnterior = usuario?.email?.toLowerCase();
    const usuariosAtualizados = usuarios.map((conta) =>
      conta.email?.toLowerCase() === emailAnterior
        ? { ...conta, nome: usuarioAtualizado.nome, email: usuarioAtualizado.email, usuario: usuarioAtualizado.email }
        : conta,
    );
    localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(usuariosAtualizados));
  }

  function excluirConta() {
    const emailAtual = usuario?.email?.toLowerCase();
    const usuarios = obterUsuariosLocais().filter((conta) => conta.email?.toLowerCase() !== emailAtual);
    localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios));
    localStorage.removeItem(CHAVE_AUTENTICACAO);
    if (emailAtual) localStorage.removeItem(`${CHAVE_PERFIL}:${emailAtual}`);
    localStorage.removeItem(CHAVE_PREFERENCIAS);
    setUsuario(null);
    setPagina("inicio");
    localStorage.setItem(CHAVE_PAGINA, "inicio");
  }

  function alterarSenha(senhaAtual, novaSenha) {
    const usuarios = obterUsuariosLocais();
    const emailAtual = usuario?.email?.toLowerCase();
    const indice = usuarios.findIndex((conta) => conta.email?.toLowerCase() === emailAtual);
    if (indice < 0 || usuarios[indice].senha !== senhaAtual) return false;
    const atualizados = [...usuarios];
    atualizados[indice] = { ...atualizados[indice], senha: novaSenha };
    localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(atualizados));
    return true;
  }

  function alterarPreferencia(campo, valor) {
    setPreferencias((estado) => ({ ...estado, [campo]: valor }));
  }

  function fazerLogout() {
    setUsuario(null);
    localStorage.removeItem(CHAVE_AUTENTICACAO);
    setPagina("inicio");
    localStorage.setItem(CHAVE_PAGINA, "inicio");
  }



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
            onLogout={fazerLogout}
            onUpdateUsuario={atualizarUsuario}
            onDeleteAccount={excluirConta}
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
            preferencias={preferencias}
            onAlterarPreferencia={alterarPreferencia}
            onAlterarSenha={alterarSenha}
            onUpdateUsuario={atualizarUsuario}
            onDeleteAccount={excluirConta}
          />
        );

      case "publicar-habilidade":
        return <Habilidades onNavigate={navegarPara} />;

      case "inicio":
      default:
        return <Body onNavigate={navegarPara} usuario={usuario} />;
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
      <Footer onNavigate={navegarPara} />
    </div>
  );
}

export default App;
