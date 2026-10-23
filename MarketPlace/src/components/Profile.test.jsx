import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Perfil from "./Profile.jsx";

const usuario = {
  id: "conta-a",
  nome: "Ana Souza",
  email: "ana@example.com",
  curso: "Análise e Desenvolvimento de Sistemas",
  periodo: "3º período",
  cidade: "Vitória",
  bio: "Gosto de tecnologia.",
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Meu Perfil", () => {
  it("ignora registros inválidos de habilidades, conexões e oportunidades", () => {
    localStorage.setItem("marketfaesa-habilidades:conta-a", JSON.stringify([
      null,
      42,
      { nome: 123, categoria: "Tecnologia" },
      { id: 1, nome: "React", categoria: "Tecnologia" },
    ]));
    localStorage.setItem("marketfaesa-conexoes:conta-a", JSON.stringify([null, {}, "perfil-1", "perfil-1", 7]));
    localStorage.setItem("marketfaesa-participando:conta-a", JSON.stringify([null, "1", 1, 1, -2]));

    render(<Perfil usuario={usuario} onUpdateUsuario={vi.fn(() => true)} onNavigate={vi.fn()} />);

    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Tecnologia")).toBeInTheDocument();
    expect(screen.getAllByText("2", { selector: ".perfil-stat strong" })).toHaveLength(1);
    expect(screen.getAllByText("1", { selector: ".perfil-stat strong" })).toHaveLength(3);
  });

  it("exibe erro e mantém a edição aberta se a persistência falhar", async () => {
    const user = userEvent.setup();
    const onUpdateUsuario = vi.fn(() => false);
    render(<Perfil usuario={usuario} onUpdateUsuario={onUpdateUsuario} onNavigate={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Editar perfil/ }));
    await user.clear(screen.getByPlaceholderText("Digite seu nome completo"));
    await user.type(screen.getByPlaceholderText("Digite seu nome completo"), "Ana Souza Atualizada");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(onUpdateUsuario).toHaveBeenCalledWith(expect.objectContaining({ nome: "Ana Souza Atualizada" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível salvar as alterações");
    expect(screen.getByPlaceholderText("Digite seu nome completo")).toHaveValue("Ana Souza Atualizada");
    expect(screen.queryByText("✓ Perfil atualizado e salvo")).not.toBeInTheDocument();
  });

  it("exige nome antes de salvar", async () => {
    const user = userEvent.setup();
    const onUpdateUsuario = vi.fn(() => true);
    render(<Perfil usuario={usuario} onUpdateUsuario={onUpdateUsuario} onNavigate={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Editar perfil/ }));
    await user.clear(screen.getByPlaceholderText("Digite seu nome completo"));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Informe seu nome completo");
    expect(onUpdateUsuario).not.toHaveBeenCalled();
  });

  it("confirma o salvamento apenas após a persistência", async () => {
    const user = userEvent.setup();
    const onUpdateUsuario = vi.fn(() => true);
    render(<Perfil usuario={usuario} onUpdateUsuario={onUpdateUsuario} onNavigate={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Editar perfil/ }));
    await user.clear(screen.getByPlaceholderText("Digite seu nome completo"));
    await user.type(screen.getByPlaceholderText("Digite seu nome completo"), "Ana Souza Atualizada");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(screen.getByRole("status")).toHaveTextContent("Perfil atualizado e salvo");
    expect(screen.getByRole("heading", { name: /Ana Souza Atualizada/ })).toBeInTheDocument();
  });
});
