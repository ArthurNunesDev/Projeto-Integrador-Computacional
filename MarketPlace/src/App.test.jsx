import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App.jsx";
import { cadastrar, login, sair } from "./api/auth.js";
import { ApiError, MENSAGEM_FALHA_REDE, salvarToken } from "./api/client.js";
import { obterConfiguracoes, obterMe, salvarConfiguracoes } from "./api/usuarios.js";

// Guarda o callback que o App registra para 401, como o client faria.
const gancho = vi.hoisted(() => ({ atual: null }));

vi.mock("./api/auth.js");
vi.mock("./api/usuarios.js");
vi.mock("./api/client.js", async (importOriginal) => ({
  ...(await importOriginal()),
  definirOnNaoAutenticado: (callback) => {
    gancho.atual = callback;
    return () => {
      if (gancho.atual === callback) gancho.atual = null;
    };
  },
}));

const USUARIO_API = {
  id: 7,
  nome: "Ana Souza",
  email: "ana@faesa.br",
  curso: { id: 2, nome: "Direito" },
  periodo: 3,
  cidade: "Vitória, ES",
  bio: null,
  fotoUrl: null,
  criadoEm: "2026-10-06T13:10:12Z",
};

const CONFIG_API = {
  tema: "dark",
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

function erroApi(status, mensagem, campos = null) {
  return new ApiError({ status, mensagem, campos });
}

async function entrar(email, senha) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText("E-mail"), email);
  if (senha) await user.type(screen.getByLabelText("Senha"), senha);
  await user.click(screen.getByRole("button", { name: "Entrar" }));
  return user;
}

async function cadastrarPelaTela({ nome = "Ana Souza", email = "ana@faesa.br", senha = "segredo123", confirmar = senha } = {}) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Criar conta" }));
  await user.type(screen.getByLabelText("Nome"), nome);
  await user.type(screen.getByLabelText("E-mail"), email);
  await user.type(screen.getByLabelText("Senha"), senha);
  await user.type(screen.getByLabelText("Confirmar senha"), confirmar);
  await user.click(screen.getByRole("button", { name: "Cadastrar" }));
  return user;
}

beforeEach(() => {
  localStorage.clear();
  gancho.atual = null;
  for (const mock of [cadastrar, login, sair, obterMe, obterConfiguracoes, salvarConfiguracoes]) {
    vi.mocked(mock).mockReset();
  }
  vi.mocked(obterConfiguracoes).mockResolvedValue(CONFIG_API);
  vi.mocked(salvarConfiguracoes).mockImplementation(async (config) => config);
});

afterEach(() => {
  cleanup();
});

describe("login", () => {
  it("entra com e-mail e senha pela API e carrega as configurações", async () => {
    vi.mocked(login).mockResolvedValue({ token: "jwt", usuario: USUARIO_API });
    render(<App />);

    await entrar("ana@faesa.br", "segredo123");

    expect(await screen.findByRole("button", { name: "Menu do perfil" })).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith({ email: "ana@faesa.br", senha: "segredo123" });
    expect(obterConfiguracoes).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
  });

  it("mostra mensagem de credenciais inválidas no 401", async () => {
    vi.mocked(login).mockRejectedValue(erroApi(401, "E-mail ou senha inválidos"));
    render(<App />);

    await entrar("ana@faesa.br", "errada123");

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha inválidos.");
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });

  it("mostra a mensagem do client na falha de rede", async () => {
    vi.mocked(login).mockRejectedValue(erroApi(0, MENSAGEM_FALHA_REDE));
    render(<App />);

    await entrar("ana@faesa.br", "segredo123");

    expect(await screen.findByRole("alert")).toHaveTextContent(MENSAGEM_FALHA_REDE);
  });

  it("exige e-mail e senha antes de chamar a API", async () => {
    render(<App />);
    await entrar();
    expect(screen.getByRole("alert")).toHaveTextContent("Preencha seu e-mail e sua senha.");
    expect(login).not.toHaveBeenCalled();
  });

  it("usa campo de e-mail e alterna a visibilidade da senha", async () => {
    render(<App />);
    const user = userEvent.setup();
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("type", "email");
    const senha = screen.getByLabelText("Senha");
    expect(senha).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(senha).toHaveAttribute("type", "text");
  });
});

describe("cadastro", () => {
  it("bloqueia senha com menos de 8 caracteres no front", async () => {
    render(<App />);
    await cadastrarPelaTela({ senha: "1234567" });

    expect(screen.getByRole("alert")).toHaveTextContent("A senha deve ter pelo menos 8 caracteres.");
    expect(cadastrar).not.toHaveBeenCalled();
  });

  it("mostra os erros por campo devolvidos pela API", async () => {
    vi.mocked(cadastrar).mockRejectedValue(
      erroApi(400, "Dados inválidos", { email: "deve ser um endereço de e-mail bem formado" }),
    );
    render(<App />);

    await cadastrarPelaTela({ email: "ana@faesa" });

    expect(await screen.findByText("deve ser um endereço de e-mail bem formado")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Dados inválidos");
    expect(login).not.toHaveBeenCalled();
  });

  it("avisa quando o e-mail já está cadastrado (409)", async () => {
    vi.mocked(cadastrar).mockRejectedValue(erroApi(409, "E-mail já cadastrado"));
    render(<App />);

    await cadastrarPelaTela();

    expect(await screen.findByRole("alert")).toHaveTextContent("Este e-mail já está cadastrado.");
  });

  it("cadastra e entra automaticamente", async () => {
    vi.mocked(cadastrar).mockResolvedValue(USUARIO_API);
    vi.mocked(login).mockResolvedValue({ token: "jwt", usuario: USUARIO_API });
    render(<App />);

    await cadastrarPelaTela();

    expect(await screen.findByRole("button", { name: "Menu do perfil" })).toBeInTheDocument();
    expect(cadastrar).toHaveBeenCalledWith({ nome: "Ana Souza", email: "ana@faesa.br", senha: "segredo123" });
    expect(login).toHaveBeenCalledWith({ email: "ana@faesa.br", senha: "segredo123" });
  });
});

describe("sessão", () => {
  it("restaura a sessão com obterMe quando há token", async () => {
    salvarToken("jwt");
    localStorage.setItem("marketfaesa-pagina", "perfil");
    vi.mocked(obterMe).mockResolvedValue(USUARIO_API);
    render(<App />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando sua sessão...");
    expect(await screen.findByRole("heading", { name: /Ana Souza/ })).toBeInTheDocument();
    expect(screen.getAllByText("Direito").length).toBeGreaterThan(0);
    expect(screen.getAllByText("3º período").length).toBeGreaterThan(0);
  });

  it("sem token mostra o login sem chamar a API", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(obterMe).not.toHaveBeenCalled();
  });

  it("volta ao login quando obterMe responde 401", async () => {
    salvarToken("expirado");
    vi.mocked(obterMe).mockImplementation(async () => {
      gancho.atual?.();
      throw erroApi(401, "Não autenticado");
    });
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.getByText("Sua sessão expirou. Entre novamente.")).toBeInTheDocument();
  });

  it("um 401 durante o uso desloga", async () => {
    salvarToken("jwt");
    vi.mocked(obterMe).mockResolvedValue(USUARIO_API);
    render(<App />);
    await screen.findByRole("button", { name: "Menu do perfil" });

    act(() => gancho.atual());

    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Menu do perfil" })).toBeNull();
  });

  it("logout chama sair e volta para o login", async () => {
    salvarToken("jwt");
    vi.mocked(obterMe).mockResolvedValue(USUARIO_API);
    render(<App />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Menu do perfil" }));
    await user.click(screen.getByRole("button", { name: /Sair/ }));

    expect(sair).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });

  it("apaga as contas e a sessão antigas do localStorage", () => {
    localStorage.setItem("marketfaesa-users", JSON.stringify([{ email: "a@b.c", senha: "123456" }]));
    localStorage.setItem("marketfaesa-auth", JSON.stringify({ nome: "a" }));
    render(<App />);
    expect(localStorage.getItem("marketfaesa-users")).toBeNull();
    expect(localStorage.getItem("marketfaesa-auth")).toBeNull();
  });
});

describe("configurações", () => {
  it("salva a configuração completa ao alterar uma opção", async () => {
    salvarToken("jwt");
    localStorage.setItem("marketfaesa-pagina", "configuracoes");
    vi.mocked(obterMe).mockResolvedValue(USUARIO_API);
    render(<App />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: /Privacidade/ }));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await user.click(screen.getAllByRole("switch")[0]);

    expect(salvarConfiguracoes).toHaveBeenCalledWith({ ...CONFIG_API, perfilPublico: false });
  });
});
