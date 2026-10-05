import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App.jsx";

const CHAVE_AUTENTICACAO = "marketfaesa-auth";

async function entrar(usuario, senha) {
  const user = userEvent.setup();
  if (usuario) await user.type(screen.getByLabelText("Usuário"), usuario);
  if (senha) await user.type(screen.getByLabelText("Senha"), senha);
  await user.click(screen.getByRole("button", { name: "Entrar" }));
  return user;
}

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv("DEV", true);
  vi.stubEnv("VITE_DEV_USER", "dev");
  vi.stubEnv("VITE_DEV_PASS", "segredo");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("login", () => {
  it("exige usuário e senha", async () => {
    render(<App />);
    await entrar();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Preencha seu usuário e sua senha.",
    );
  });

  it("rejeita senha só com espaços", async () => {
    render(<App />);
    await entrar("dev", "   ");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Preencha seu usuário e sua senha.",
    );
  });

  it("rejeita credenciais inválidas", async () => {
    render(<App />);
    await entrar("dev", "errada");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Usuário ou senha inválidos.",
    );
    expect(localStorage.getItem(CHAVE_AUTENTICACAO)).toBeNull();
  });

  it("rejeita tudo se as credenciais de dev não estiverem definidas", async () => {
    vi.stubEnv("VITE_DEV_USER", "");
    vi.stubEnv("VITE_DEV_PASS", "");
    render(<App />);
    await entrar("x", "y");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Usuário ou senha inválidos.",
    );
  });

  it("alterna a visibilidade da senha", async () => {
    render(<App />);
    const user = userEvent.setup();
    const senha = screen.getByLabelText("Senha");
    expect(senha).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(senha).toHaveAttribute("type", "text");
  });

  it("entra com as credenciais de dev e persiste a sessão", async () => {
    render(<App />);
    await entrar("dev", "segredo");
    expect(screen.queryByRole("heading", { name: "Entrar" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Menu do perfil" }),
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(CHAVE_AUTENTICACAO))).toEqual({
      usuario: "dev",
      nome: "Usuário de teste",
    });
  });

  it("fora do modo dev mostra que a API está indisponível", async () => {
    vi.stubEnv("DEV", false);
    render(<App />);
    await entrar("dev", "segredo");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Login indisponível até a API estar pronta.",
    );
    expect(localStorage.getItem(CHAVE_AUTENTICACAO)).toBeNull();
  });
});

describe("sessão", () => {
  it("restaura a sessão salva ao remontar", async () => {
    const { unmount } = render(<App />);
    await entrar("dev", "segredo");
    unmount();

    render(<App />);
    expect(
      screen.getByRole("button", { name: "Menu do perfil" }),
    ).toBeInTheDocument();
  });

  it("ignora sessão corrompida no localStorage", () => {
    localStorage.setItem(CHAVE_AUTENTICACAO, "{quebrado");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });

  it("logout limpa a sessão e volta para o login", async () => {
    render(<App />);
    const user = await entrar("dev", "segredo");
    await user.click(screen.getByRole("button", { name: "Menu do perfil" }));
    await user.click(screen.getByRole("button", { name: /Sair/ }));

    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(localStorage.getItem(CHAVE_AUTENTICACAO)).toBeNull();
  });
});
