import { useCallback, useEffect, useRef, useState } from "react";

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
import { definirOnNaoAutenticado, obterToken } from "./api/client.js";
import { atualizarMe, obterConfiguracoes, obterMe, salvarConfiguracoes } from "./api/usuarios.js";
import { chaveUsuario, lerJsonUsuario, salvarJsonUsuario, lerValorSeguro, salvarValorSeguro, limparDadosAntigos } from "./storage.js";
import { corpoAtualizacao, montarUsuario } from "./perfil.js";
import { mensagemDoErro } from "./useCarregar.js";

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

// Só preferências de interface ficam no navegador, por conta: a página aberta e as preferências
// de conteúdo (sem campo na API). Perfil, tema e configurações vêm da API.
const CHAVE_PAGINA = "marketfaesa-pagina";
const CHAVE_PREFERENCIAS = "marketfaesa-preferencias";
const PREFERENCIAS_PADRAO = { area: "tecnologia", modalidade: "todas", frequencia: "imediato" };

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

const VALORES_PREFERENCIAS = {
  area: ["tecnologia", "design", "engenharia", "saude", "direito", "administracao"],
  modalidade: ["todas", "remoto", "presencial", "hibrido"],
  frequencia: ["imediato", "diario", "semanal"],
};

function normalizarPreferencias(dados) {
  const origem = dados && typeof dados === "object" && !Array.isArray(dados) ? dados : {};
  return Object.fromEntries(
    Object.entries(PREFERENCIAS_PADRAO).map(([campo, padrao]) => [
      campo,
      VALORES_PREFERENCIAS[campo].includes(origem[campo]) ? origem[campo] : padrao,
    ]),
  );
}

const MENSAGEM_SESSAO_EXPIRADA = "Sua sessão expirou. Entre novamente.";

function App() {
  const [usuario, setUsuario] = useState(null);
  // Com token salvo, a sessão é restaurada via GET /api/usuarios/me antes de mostrar o app.
  const [restaurando, setRestaurando] = useState(() => Boolean(obterToken()));
  const [erroSessao, setErroSessao] = useState("");
  const [avisoLogin, setAvisoLogin] = useState("");
  const [buscaInicialOportunidades, setBuscaInicialOportunidades] = useState("");
  const [versaoBuscaOportunidades, setVersaoBuscaOportunidades] = useState(0);
  const [conversaInicial, setConversaInicial] = useState(null);
  const [pagina, setPagina] = useState("inicio");
  const [tema, setTema] = useState("light");
  const [configuracoes, setConfiguracoes] = useState(CONFIG_PADRAO);
  // Enquanto o GET não termina, as opções ficam travadas para não salvar os padrões por cima.
  const [configuracoesCarregadas, setConfiguracoesCarregadas] = useState(false);
  const [erroCarregarConfiguracoes, setErroCarregarConfiguracoes] = useState("");
  const [erroConfiguracoes, setErroConfiguracoes] = useState("");
  const [preferencias, setPreferencias] = useState(PREFERENCIAS_PADRAO);
  // Muda a cada login/logout: respostas de uma sessão anterior são ignoradas.
  const geracaoRef = useRef(0);
  // PUTs de configuração rodam em fila, um por vez, na ordem dos cliques.
  const filaSalvarRef = useRef(Promise.resolve());
  const salvamentosPendentesRef = useRef(0);
  const falhaAoSalvarRef = useRef(false);

  useEffect(() => {
    limparDadosAntigos();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = usuario ? tema : "light";
  }, [tema, usuario]);

  const novaGeracao = useCallback(() => {
    geracaoRef.current += 1;
    salvamentosPendentesRef.current = 0;
    falhaAoSalvarRef.current = false;
    setConfiguracoes(CONFIG_PADRAO);
    setConfiguracoesCarregadas(false);
    setErroCarregarConfiguracoes("");
    setErroConfiguracoes("");
    return geracaoRef.current;
  }, []);

  const encerrarSessao = useCallback((aviso = "") => {
    novaGeracao();
    setUsuario(null);
    setErroSessao("");
    setAvisoLogin(aviso);
    setPagina("inicio");
    setTema("light");
    setPreferencias(PREFERENCIAS_PADRAO);
    setConversaInicial(null);
  }, [novaGeracao]);

  // 401 em qualquer rota autenticada: o client já limpou o token.
  useEffect(
    () => definirOnNaoAutenticado(() => encerrarSessao(MENSAGEM_SESSAO_EXPIRADA)),
    [encerrarSessao],
  );

  // Erro de uma requisição da sessão atual. Devolve false se a resposta é de uma sessão já encerrada.
  // O gancho do client já trata o 401; aqui ele é tratado de novo para nunca ficar sem voltar ao login.
  const tratarErroDaSessao = useCallback(
    (geracao, erro) => {
      if (geracao !== geracaoRef.current) return false;
      if (erro?.status === 401) {
        encerrarSessao(MENSAGEM_SESSAO_EXPIRADA);
        return false;
      }
      return true;
    },
    [encerrarSessao],
  );

  const carregarConfiguracoes = useCallback(
    async (geracao) => {
      setErroCarregarConfiguracoes("");
      try {
        const { tema: temaSalvo, ...resto } = await obterConfiguracoes();
        if (geracao !== geracaoRef.current) return;
        setTema(temaSalvo === "dark" ? "dark" : "light");
        setConfiguracoes({ ...CONFIG_PADRAO, ...resto });
        setConfiguracoesCarregadas(true);
      } catch (erro) {
        if (!tratarErroDaSessao(geracao, erro)) return;
        setConfiguracoesCarregadas(false);
        setErroCarregarConfiguracoes(`Não foi possível carregar suas configurações. ${mensagemDoErro(erro)}`);
      }
    },
    [tratarErroDaSessao],
  );

  // restaurarPagina: ao restaurar a sessão volta para a página salva; no login começa no início.
  const entrarComo = useCallback(
    (usuarioApi, restaurarPagina = false) => {
      const geracao = novaGeracao();
      setUsuario(montarUsuario(usuarioApi));
      setErroSessao("");
      setAvisoLogin("");
      const chavePagina = chaveUsuario(CHAVE_PAGINA, usuarioApi.id);
      const paginaInicial = (restaurarPagina && lerValorSeguro(chavePagina)) || "inicio";
      setPagina(paginaInicial);
      salvarValorSeguro(chavePagina, paginaInicial);
      setPreferencias(normalizarPreferencias(lerJsonUsuario(CHAVE_PREFERENCIAS, usuarioApi.id, PREFERENCIAS_PADRAO)));
      carregarConfiguracoes(geracao);
    },
    [novaGeracao, carregarConfiguracoes],
  );

  useEffect(() => {
    if (!restaurando) return undefined;

    let cancelado = false;
    obterMe()
      .then((usuarioApi) => {
        if (!cancelado) entrarComo(usuarioApi, true);
      })
      .catch((erro) => {
        if (cancelado) return;
        if (erro?.status === 401) encerrarSessao(MENSAGEM_SESSAO_EXPIRADA);
        else setErroSessao(mensagemDoErro(erro));
      })
      .finally(() => {
        if (!cancelado) setRestaurando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [restaurando, entrarComo, encerrarSessao]);

  async function fazerLogin({ email, senha }) {
    try {
      const resposta = await login({ email, senha });
      entrarComo(resposta.usuario);
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

  function contaExcluida() {
    sair();
    encerrarSessao("Sua conta foi excluída.");
  }

  function sairDaSessaoComErro() {
    sair();
    setErroSessao("");
  }

  function tentarRestaurarDeNovo() {
    setErroSessao("");
    setRestaurando(true);
  }

  // PUT /api/usuarios/me com o perfil completo. Devolve {sucesso, mensagem?, campos?}.
  async function atualizarUsuario(alteracoes) {
    if (!usuario) return { sucesso: false };
    const geracao = geracaoRef.current;
    try {
      const usuarioApi = await atualizarMe(corpoAtualizacao(usuario, alteracoes));
      if (geracao === geracaoRef.current) setUsuario(montarUsuario(usuarioApi));
      return { sucesso: true };
    } catch (erro) {
      tratarErroDaSessao(geracao, erro);
      return { sucesso: false, mensagem: mensagemDoErro(erro), campos: erro?.campos || null };
    }
  }

  function alterarPreferencia(campo, valor) {
    if (!usuario?.id) return false;
    const novasPreferencias = { ...preferencias, [campo]: valor };
    if (!salvarJsonUsuario(CHAVE_PREFERENCIAS, usuario.id, novasPreferencias)) return false;
    setPreferencias(novasPreferencias);
    return true;
  }

  // Atualiza na hora e envia a configuração completa. Os PUTs vão em fila, então o
  // último clique é o último gravado. Se algum falhar, ao fim da fila a tela é
  // recarregada com o que está salvo na API.
  function persistirConfiguracoes(novoTema, novasConfiguracoes) {
    if (!configuracoesCarregadas) return;
    const geracao = geracaoRef.current;
    const corpo = { tema: novoTema, ...novasConfiguracoes };
    setTema(novoTema);
    setConfiguracoes(novasConfiguracoes);
    setErroConfiguracoes("");
    salvamentosPendentesRef.current += 1;

    filaSalvarRef.current = filaSalvarRef.current
      .then(() => (geracao === geracaoRef.current ? salvarConfiguracoes(corpo) : null))
      .then(
        () => terminarSalvamento(geracao),
        (erro) => {
          if (!tratarErroDaSessao(geracao, erro)) return;
          falhaAoSalvarRef.current = true;
          setErroConfiguracoes(`Não foi possível salvar. ${mensagemDoErro(erro)}`);
          terminarSalvamento(geracao);
        },
      );
  }

  function terminarSalvamento(geracao) {
    if (geracao !== geracaoRef.current) return;
    salvamentosPendentesRef.current -= 1;
    if (salvamentosPendentesRef.current > 0 || !falhaAoSalvarRef.current) return;
    falhaAoSalvarRef.current = false;
    recarregarDepoisDeFalha(geracao);
  }

  async function recarregarDepoisDeFalha(geracao) {
    try {
      const { tema: temaSalvo, ...resto } = await obterConfiguracoes();
      if (geracao !== geracaoRef.current || salvamentosPendentesRef.current > 0) return;
      setTema(temaSalvo === "dark" ? "dark" : "light");
      setConfiguracoes({ ...CONFIG_PADRAO, ...resto });
    } catch (erro) {
      if (!tratarErroDaSessao(geracao, erro)) return;
      // Sem saber o que ficou salvo, trava as opções até recarregar.
      setConfiguracoesCarregadas(false);
      setErroCarregarConfiguracoes(`Não foi possível carregar suas configurações. ${mensagemDoErro(erro)}`);
    }
  }

  function recarregarConfiguracoes() {
    carregarConfiguracoes(geracaoRef.current);
  }

  function alterarTema(novoTema) {
    persistirConfiguracoes(novoTema === "dark" ? "dark" : "light", configuracoes);
  }

  function alterarConfiguracao(campo) {
    persistirConfiguracoes(tema, { ...configuracoes, [campo]: !configuracoes[campo] });
  }

  function navegarPara(novaPagina) {
    setPagina(novaPagina);
    if (usuario?.id) salvarValorSeguro(chaveUsuario(CHAVE_PAGINA, usuario.id), novaPagina);

    const reduzirMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: reduzirMovimento ? "auto" : "smooth",
    });
  }

  function buscarOportunidades(termo) {
    setBuscaInicialOportunidades(termo);
    setVersaoBuscaOportunidades((versao) => versao + 1);
    navegarPara("oportunidades");
  }

  // Chamado depois de POST /api/conversas: abre a tela de mensagens já nessa conversa.
  function abrirConversaNaTela(conversaId) {
    setConversaInicial(conversaId);
    navegarPara("mensagens");
  }

  function renderizarPagina() {
    switch (pagina) {
      case "oportunidades":
        return (
          <Oportunidades
            key={`${buscaInicialOportunidades}:${versaoBuscaOportunidades}`}
            usuarioId={usuario?.id}
            initialSearch={buscaInicialOportunidades}
          />
        );

      case "habilidades":
        return <PeopleSkills onNavigate={navegarPara} onAbrirConversa={abrirConversaNaTela} />;

      case "conexoes":
        return <Connections onNavigate={navegarPara} onAbrirConversa={abrirConversaNaTela} />;

      case "mensagens":
        return <Messages conversaInicial={conversaInicial} />;

      case "salvos":
        return <Salvos onNavigate={navegarPara} />;

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
            onContaExcluida={contaExcluida}
          />
        );

      case "publicar-habilidade":
        return <Habilidades onNavigate={navegarPara} usuario={usuario} />;

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
