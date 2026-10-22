import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App.jsx";
import { cadastrar, login, obterSessaoLocal, sair } from "./api/auth.js";
import { chaveUsuario, lerJsonUsuario, salvarJsonUsuario } from "./storage.js";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

async function cadastrarPelaTela({
  nome = "Ana Souza",
  email = "ana@faesa.br",
  senha = "segredo123",
  confirmar = senha,
} = {}) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Criar conta" }));
  await user.type(screen.getByLabelText("Nome"), nome);
  await user.type(screen.getByLabelText("E-mail"), email);
  await user.type(screen.getByLabelText("Senha"), senha);
  await user.type(screen.getByLabelText("Confirmar senha"), confirmar);
  await user.click(screen.getByRole("button", { name: "Cadastrar" }));
  return user;
}

describe("autenticação local demonstrativa", () => {
  it("mostra a tela de login quando não há sessão salva", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(obterSessaoLocal()).toBeNull();
  });

  it("não carrega nem grava preferências genéricas quando não há conta ativa", () => {
    localStorage.setItem("marketfaesa-theme:sem-conta", "dark");
    localStorage.setItem(
      "marketfaesa-preferencias:sem-conta",
      JSON.stringify({ area: "dados-de-outra-conta" }),
    );
    localStorage.setItem(
      "marketfaesa-configuracoes:sem-conta",
      JSON.stringify({ tema: "dark", perfilPublico: false }),
    );

    render(<App />);

    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("marketfaesa-theme:sem-conta")).toBe("dark");
    expect(JSON.parse(localStorage.getItem("marketfaesa-preferencias:sem-conta"))).toEqual({
      area: "dados-de-outra-conta",
    });
    expect(JSON.parse(localStorage.getItem("marketfaesa-configuracoes:sem-conta"))).toEqual({
      tema: "dark",
      perfilPublico: false,
    });
  });

  it("valida a senha antes de cadastrar", async () => {
    render(<App />);

    await cadastrarPelaTela({ senha: "1234567" });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "A senha deve ter pelo menos 8 caracteres.",
    );
    expect(localStorage.getItem("marketfaesa-users")).toBeNull();
  });

  it("cadastra uma conta local e entra automaticamente", async () => {
    render(<App />);

    await cadastrarPelaTela();

    expect(await screen.findByRole("button", { name: "Menu do perfil" })).toBeInTheDocument();
    expect(obterSessaoLocal()).toMatchObject({
      nome: "Ana Souza",
      email: "ana@faesa.br",
    });
  });

  it("mostra oportunidades de tecnologia multidisciplinar ao filtrar Tecnologia na página inicial", async () => {
    render(<App />);
    const user = await cadastrarPelaTela();

    await user.click(screen.getByRole("button", { name: "Tecnologia" }));

    expect(
      screen.getByRole("heading", { name: "Desenvolvimento de App para Clínica" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Revisão Jurídica de Contratos Digitais" }),
    ).toBeInTheDocument();
  });

  it("continua renderizando após sair de Oportunidades pelo menu principal", async () => {
    render(<App />);
    await cadastrarPelaTela();

    const user = userEvent.setup();
    await screen.findByRole("button", { name: "Menu do perfil" });

    await user.click(screen.getByRole("button", { name: "Abrir menu principal" }));
    const menuPrincipal = screen.getByRole("navigation");
    await user.click(within(menuPrincipal).getByRole("button", { name: /Oportunidades/ }));
    expect(await screen.findByRole("heading", { name: "Oportunidades" })).toBeInTheDocument();

    const menuToggle = screen.getByRole("button", { name: /menu principal/i });
    if (menuToggle.getAttribute("aria-expanded") !== "true") {
      await user.click(menuToggle);
    }
    await user.click(within(screen.getByRole("navigation")).getByRole("button", { name: /Início/ }));

    expect(await screen.findByRole("heading", { name: /Oportunidades em Destaque/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Menu do perfil" })).toBeInTheDocument();
  });

  it("continua renderizando após sair de Mensagens pelo menu principal", async () => {
    render(<App />);
    await cadastrarPelaTela();

    const user = userEvent.setup();
    await screen.findByRole("button", { name: "Menu do perfil" });

    await user.click(screen.getByRole("button", { name: "Abrir menu principal" }));
    const menuPrincipal = screen.getByRole("navigation");
    await user.click(within(menuPrincipal).getByRole("button", { name: /Mensagens/ }));
    expect(await screen.findByRole("heading", { name: "Nenhuma conversa" })).toBeInTheDocument();

    const menuToggle = screen.getByRole("button", { name: /menu principal/i });
    if (menuToggle.getAttribute("aria-expanded") !== "true") {
      await user.click(menuToggle);
    }
    await user.click(within(screen.getByRole("navigation")).getByRole("button", { name: /Início/ }));

    expect(await screen.findByRole("heading", { name: /Oportunidades em Destaque/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Menu do perfil" })).toBeInTheDocument();
  });

  it("normaliza o e-mail e impede cadastro duplicado", async () => {
    await cadastrar({ nome: "Ana Souza", email: "ANA@FAESA.BR", senha: "segredo123" });

    await expect(
      cadastrar({ nome: "Outra Ana", email: "ana@faesa.br", senha: "outrasenha123" }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("permite entrar com a conta cadastrada e encerrar a sessão", async () => {
    await cadastrar({ nome: "Ana Souza", email: "ana@faesa.br", senha: "segredo123" });
    sair();
    render(<App />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("E-mail"), "ana@faesa.br");
    await user.type(screen.getByLabelText("Senha"), "segredo123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("button", { name: "Menu do perfil" })).toBeInTheDocument();
    expect((await login({ email: "ana@faesa.br", senha: "segredo123" })).usuario.nome).toBe("Ana Souza");

    await user.click(screen.getByRole("button", { name: "Menu do perfil" }));
    await user.click(screen.getByRole("button", { name: /Sair/ }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument());
    expect(obterSessaoLocal()).toBeNull();
  });
});

describe("armazenamento isolado por conta", () => {
  it("gera chaves diferentes para contas diferentes", () => {
    expect(chaveUsuario("marketfaesa-salvos", "conta-a")).not.toBe(
      chaveUsuario("marketfaesa-salvos", "conta-b"),
    );
  });

  it("mantém os dados separados entre usuários", () => {
    salvarJsonUsuario("marketfaesa-salvos", "conta-a", [{ id: 1 }]);
    salvarJsonUsuario("marketfaesa-salvos", "conta-b", [{ id: 2 }]);

    expect(lerJsonUsuario("marketfaesa-salvos", "conta-a", [])).toEqual([{ id: 1 }]);
    expect(lerJsonUsuario("marketfaesa-salvos", "conta-b", [])).toEqual([{ id: 2 }]);
  });

  it("retorna o valor padrão quando o JSON salvo está corrompido", () => {
    localStorage.setItem(chaveUsuario("marketfaesa-salvos", "conta-a"), "{json inválido");

    expect(lerJsonUsuario("marketfaesa-salvos", "conta-a", [])).toEqual([]);
  });
});
