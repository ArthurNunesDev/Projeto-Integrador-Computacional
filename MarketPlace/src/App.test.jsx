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

function adiado() {
  let resolver;
  let rejeitar;
  const promessa = new Promise((res, rej) => {
    resolver = res;
    rejeitar = rej;
  });
  return { promessa, resolver, rejeitar };
}

async function sairPeloMenu(user) {
  await user.click(screen.getByRole("button", { name: "Menu do perfil" }));
  await user.click(screen.getByRole("button", { name: /Sair/ }));
}

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

  it("logout real apaga o token do localStorage", async () => {
    const authReal = await vi.importActual("./api/auth.js");
    vi.mocked(sair).mockImplementation(authReal.sair);
    salvarToken("jwt");
    vi.mocked(obterMe).mockResolvedValue(USUARIO_API);
    render(<App />);
    const user = userEvent.setup();
    await screen.findByRole("button", { name: "Menu do perfil" });

    await sairPeloMenu(user);

    expect(localStorage.getItem("marketfaesa-token")).toBeNull();
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });

  it("um 401 nas configurações volta ao login com aviso mesmo sem o gancho", async () => {
    salvarToken("jwt");
    vi.mocked(obterMe).mockResolvedValue(USUARIO_API);
    vi.mocked(obterConfiguracoes).mockRejectedValue(erroApi(401, "Não autenticado"));
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.getByText("Sua sessão expirou. Entre novamente.")).toBeInTheDocument();
  });

  it("apaga as contas e a sessão antigas do localStorage", () => {
    localStorage.setItem("marketfaesa-users", JSON.stringify([{ email: "a@b.c", senha: "123456" }]));
    localStorage.setItem("marketfaesa-auth", JSON.stringify({ nome: "a" }));
    render(<App />);
    expect(localStorage.getItem("marketfaesa-users")).toBeNull();
    expect(localStorage.getItem("marketfaesa-auth")).toBeNull();
  });
});

function abrirConfiguracoes() {
  salvarToken("jwt");
  localStorage.setItem("marketfaesa-pagina", "configuracoes");
  vi.mocked(obterMe).mockResolvedValue(USUARIO_API);
  render(<App />);
  return userEvent.setup();
}

describe("configurações", () => {
  it("não salva nada enquanto o GET de configurações não responde", async () => {
    const get = adiado();
    vi.mocked(obterConfiguracoes).mockReturnValue(get.promessa);
    const user = abrirConfiguracoes();

    await user.click(await screen.findByRole("button", { name: /Privacidade/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Carregando suas configurações...");
    const perfilPublico = screen.getByRole("switch", { name: "Perfil público" });
    expect(perfilPublico).toBeDisabled();
    await user.click(perfilPublico);
    expect(salvarConfiguracoes).not.toHaveBeenCalled();

    await act(async () => get.resolver({ ...CONFIG_API, perfilPublico: false }));
    expect(perfilPublico).toBeEnabled();
    expect(perfilPublico).toHaveAttribute("aria-checked", "false");
  });

  it("se o GET falha, mostra o erro e permite tentar de novo", async () => {
    vi.mocked(obterConfiguracoes).mockRejectedValueOnce(erroApi(500, "Erro interno"));
    const user = abrirConfiguracoes();

    await user.click(await screen.findByRole("button", { name: /Privacidade/ }));
    expect(await screen.findByText(/Não foi possível carregar suas configurações. Erro interno/)).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Perfil público" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => expect(screen.getByRole("switch", { name: "Perfil público" })).toBeEnabled());
    expect(obterConfiguracoes).toHaveBeenCalledTimes(2);
    expect(salvarConfiguracoes).not.toHaveBeenCalled();
  });

  it("ignora a resposta atrasada do GET depois do logout", async () => {
    localStorage.setItem("marketfaesa-theme", "light");
    const get = adiado();
    vi.mocked(obterConfiguracoes).mockReturnValueOnce(get.promessa);
    const user = abrirConfiguracoes();
    await screen.findByRole("button", { name: "Menu do perfil" });

    await sairPeloMenu(user);
    await act(async () => get.resolver(CONFIG_API));

    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("ignora a resposta atrasada do GET da conta anterior", async () => {
    localStorage.setItem("marketfaesa-theme", "light");
    const getAntigo = adiado();
    vi.mocked(obterConfiguracoes)
      .mockReturnValueOnce(getAntigo.promessa)
      .mockResolvedValueOnce({ ...CONFIG_API, tema: "light", perfilPublico: false });
    vi.mocked(login).mockResolvedValue({ token: "jwt2", usuario: { ...USUARIO_API, id: 8, email: "bia@faesa.br" } });
    const user = abrirConfiguracoes();
    await screen.findByRole("button", { name: "Menu do perfil" });

    await sairPeloMenu(user);
    await entrar("bia@faesa.br", "segredo123");
    await screen.findByRole("button", { name: "Menu do perfil" });
    await user.click(screen.getByRole("button", { name: "Configurações" }));
    await user.click(screen.getByRole("button", { name: /Privacidade/ }));
    await waitFor(() => expect(screen.getByRole("switch", { name: "Perfil público" })).toBeEnabled());

    await act(async () => getAntigo.resolver(CONFIG_API));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(screen.getByRole("switch", { name: "Perfil público" })).toHaveAttribute("aria-checked", "false");
  });

  it("envia os PUTs em fila, um por vez", async () => {
    const put = adiado();
    vi.mocked(salvarConfiguracoes).mockReturnValueOnce(put.promessa);
    const user = abrirConfiguracoes();

    await user.click(await screen.findByRole("button", { name: /Privacidade/ }));
    await waitFor(() => expect(screen.getByRole("switch", { name: "Perfil público" })).toBeEnabled());
    await user.click(screen.getByRole("switch", { name: "Perfil público" }));
    await user.click(screen.getByRole("switch", { name: "Exibir e-mail" }));
    expect(salvarConfiguracoes).toHaveBeenCalledTimes(1);

    await act(async () => put.resolver());

    await waitFor(() => expect(salvarConfiguracoes).toHaveBeenCalledTimes(2));
    expect(salvarConfiguracoes).toHaveBeenLastCalledWith({ ...CONFIG_API, perfilPublico: false, mostrarEmail: true });
  });

  it("se um PUT falha, recarrega as configurações da API", async () => {
    vi.mocked(salvarConfiguracoes).mockRejectedValueOnce(erroApi(500, "Erro interno"));
    const user = abrirConfiguracoes();

    await user.click(await screen.findByRole("button", { name: /Privacidade/ }));
    await waitFor(() => expect(screen.getByRole("switch", { name: "Perfil público" })).toBeEnabled());
    await user.click(screen.getByRole("switch", { name: "Perfil público" }));

    expect(await screen.findByText("Não foi possível salvar. Erro interno")).toBeInTheDocument();
    await waitFor(() => expect(obterConfiguracoes).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByRole("switch", { name: "Perfil público" })).toHaveAttribute("aria-checked", "true"),
    );
  });

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
