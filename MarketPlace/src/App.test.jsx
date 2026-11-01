import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App.jsx";
import { obterToken, salvarToken } from "./api/client.js";
import { chamadas, CONFIGURACOES, erroApi, mockarApi, oportunidade, USUARIO_API } from "./test/apiFalsa.js";

// Rotas que a página inicial consulta depois de entrar.
const ROTAS_INICIO = {
  "GET /api/usuarios/me/configuracoes": CONFIGURACOES,
  "GET /api/oportunidades": [
    oportunidade(10, "Revisão de Contratos Digitais"),
    oportunidade(11, "App para Clínica"),
  ],
  "GET /api/areas": [],
  "GET /api/habilidades-publicadas": [],
  "GET /api/pessoas": [],
  "GET /api/conexoes": [],
  "GET /api/usuarios/me/participacoes": [],
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

async function entrarPelaTela(email = "ana@faesa.br", senha = "segredo123") {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("E-mail"), email);
  await user.type(screen.getByLabelText("Senha"), senha);
  await user.click(screen.getByRole("button", { name: "Entrar" }));
  return user;
}

describe("autenticação pela API", () => {
  it("mostra o login sem token e não chama a API", () => {
    const fetchFalso = mockarApi({});
    render(<App />);

    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("apaga do navegador as contas e dados do modo demonstrativo", () => {
    mockarApi({});
    localStorage.setItem("marketfaesa-users", JSON.stringify([{ email: "a@b.c", senha: "texto-puro" }]));
    localStorage.setItem("marketfaesa-auth", "{}");
    localStorage.setItem("marketfaesa-salvos:1", "[]");
    localStorage.setItem("marketfaesa-pagina:1", "perfil");

    render(<App />);

    expect(localStorage.getItem("marketfaesa-users")).toBeNull();
    expect(localStorage.getItem("marketfaesa-auth")).toBeNull();
    expect(localStorage.getItem("marketfaesa-salvos:1")).toBeNull();
    expect(localStorage.getItem("marketfaesa-pagina:1")).toBe("perfil");
  });

  it("entra com POST /api/auth/login, guarda só o token e aplica o tema da API", async () => {
    const fetchFalso = mockarApi({
      ...ROTAS_INICIO,
      "POST /api/auth/login": { token: "jwt-1", usuario: USUARIO_API },
      "GET /api/usuarios/me/configuracoes": { ...CONFIGURACOES, tema: "dark" },
    });
    render(<App />);

    await entrarPelaTela();

    expect(await screen.findByRole("button", { name: "Menu do perfil" })).toBeInTheDocument();
    expect(chamadas(fetchFalso, "POST /api/auth/login")).toEqual([{ email: "ana@faesa.br", senha: "segredo123" }]);
    expect(obterToken()).toBe("jwt-1");
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    expect(Object.keys(localStorage).some((chave) => /senha|users|auth/.test(chave))).toBe(false);
  });

  it("mostra erro de credenciais quando o login volta 401", async () => {
    mockarApi({ "POST /api/auth/login": erroApi(401, "Credenciais inválidas") });
    render(<App />);

    await entrarPelaTela("ana@faesa.br", "errada123");

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha inválidos.");
    expect(obterToken()).toBeNull();
  });

  it("cadastra e entra em seguida", async () => {
    const fetchFalso = mockarApi({
      ...ROTAS_INICIO,
      "POST /api/auth/register": USUARIO_API,
      "POST /api/auth/login": { token: "jwt-1", usuario: USUARIO_API },
    });
    render(<App />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    await user.type(screen.getByLabelText("Nome"), "Ana Souza");
    await user.type(screen.getByLabelText("E-mail"), "ana@faesa.br");
    await user.type(screen.getByLabelText("Senha"), "segredo123");
    await user.type(screen.getByLabelText("Confirmar senha"), "segredo123");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByRole("button", { name: "Menu do perfil" })).toBeInTheDocument();
    expect(chamadas(fetchFalso, "POST /api/auth/register")).toEqual([
      { nome: "Ana Souza", email: "ana@faesa.br", senha: "segredo123" },
    ]);
  });

  it("avisa quando o e-mail já está cadastrado (409)", async () => {
    mockarApi({ "POST /api/auth/register": erroApi(409, "E-mail já cadastrado") });
    render(<App />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    await user.type(screen.getByLabelText("Nome"), "Ana Souza");
    await user.type(screen.getByLabelText("E-mail"), "ana@faesa.br");
    await user.type(screen.getByLabelText("Senha"), "segredo123");
    await user.type(screen.getByLabelText("Confirmar senha"), "segredo123");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Este e-mail já está cadastrado.");
  });

  it("restaura a sessão com GET /api/usuarios/me e volta para a página salva", async () => {
    salvarToken("jwt-salvo");
    localStorage.setItem("marketfaesa-pagina:1", "oportunidades");
    const fetchFalso = mockarApi({ ...ROTAS_INICIO, "GET /api/usuarios/me": USUARIO_API });

    render(<App />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando sua sessão...");
    expect(await screen.findByRole("heading", { name: "Oportunidades" })).toBeInTheDocument();
    const [, opcoes] = fetchFalso.mock.calls.find(([url]) => url.endsWith("/api/usuarios/me"));
    expect(opcoes.headers.Authorization).toBe("Bearer jwt-salvo");
  });

  it("volta ao login com aviso quando o token salvo expirou", async () => {
    salvarToken("jwt-vencido");
    mockarApi({ "GET /api/usuarios/me": erroApi(401, "Não autenticado") });

    render(<App />);

    expect(await screen.findByText("Sua sessão expirou. Entre novamente.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(obterToken()).toBeNull();
  });

  it("sai da conta descartando o token", async () => {
    salvarToken("jwt-salvo");
    mockarApi({ ...ROTAS_INICIO, "GET /api/usuarios/me": USUARIO_API });
    render(<App />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Menu do perfil" }));
    await user.click(screen.getByRole("button", { name: /Sair/ }));

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(obterToken()).toBeNull();
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});

describe("navegação com dados da API", () => {
  it("encaminha a busca do cabeçalho para oportunidades com o termo aplicado", async () => {
    salvarToken("jwt-salvo");
    mockarApi({ ...ROTAS_INICIO, "GET /api/usuarios/me": USUARIO_API });
    render(<App />);
    const user = userEvent.setup();

    const buscaGlobal = await screen.findByRole("searchbox", { name: "Buscar oportunidades no MarketFAESA" });
    await user.type(buscaGlobal, "Contratos");
    await user.keyboard("{Enter}");

    expect(await screen.findByRole("heading", { name: "Revisão de Contratos Digitais" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "App para Clínica" })).not.toBeInTheDocument();
  });

  it("vai do menu para Mensagens e volta ao início", async () => {
    salvarToken("jwt-salvo");
    mockarApi({ ...ROTAS_INICIO, "GET /api/usuarios/me": USUARIO_API, "GET /api/conversas": [] });
    render(<App />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Abrir menu principal" }));
    await user.click(within(screen.getByRole("navigation")).getByRole("button", { name: /Mensagens/ }));
    expect(await screen.findByRole("heading", { name: "Nenhuma conversa" })).toBeInTheDocument();

    const menuToggle = screen.getByRole("button", { name: /menu principal/i });
    if (menuToggle.getAttribute("aria-expanded") !== "true") await user.click(menuToggle);
    await user.click(within(screen.getByRole("navigation")).getByRole("button", { name: /Início/ }));

    expect(await screen.findByRole("heading", { name: /Oportunidades em Destaque/i })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
