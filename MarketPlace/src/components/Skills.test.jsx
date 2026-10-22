import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Habilidades from "./Skills.jsx";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("Habilidades", () => {
  it("mostra uma mensagem orientativa quando a conta ainda não tem habilidades", () => {
    render(<Habilidades usuarioId="conta-a" usuario={{ id: "conta-a", email: "ana@faesa.br" }} onNavigate={() => {}} />);

    expect(screen.getByRole("heading", { name: "Você ainda não publicou nenhuma habilidade" })).toBeInTheDocument();
    expect(screen.getByText(/Use o botão “Criar habilidade” acima para começar/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Criar habilidade/ })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /Adicionar/ })).not.toBeInTheDocument();
  });

  it("exibe os cards quando há habilidades publicadas e oculta o estado vazio", () => {
    localStorage.setItem(
      "marketfaesa-habilidades:conta-a",
      JSON.stringify([
        {
          id: 1,
          nome: "React",
          categoria: "Tecnologia",
          nivel: "Intermediário",
          descricao: "Desenvolvimento de interfaces.",
          disponibilidade: "Projetos e freelas",
        },
      ]),
    );

    render(<Habilidades usuarioId="conta-a" usuario={{ id: "conta-a", email: "ana@faesa.br" }} onNavigate={() => {}} />);

    expect(screen.getByRole("heading", { name: "React" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Você ainda não publicou nenhuma habilidade" })).not.toBeInTheDocument();
  });

  it("abre o formulário pelo botão principal de criação", async () => {
    const user = userEvent.setup();
    render(<Habilidades usuarioId="conta-a" usuario={{ id: "conta-a", email: "ana@faesa.br" }} onNavigate={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Criar habilidade/ }));

    expect(screen.getByRole("heading", { name: "Criar uma habilidade" })).toBeInTheDocument();
  });
});
