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

  it("ignora habilidades inválidas sem sobrescrever os dados durante a leitura", () => {
    const dados = [
      null,
      42,
      { id: 2, nome: "Incompleta" },
      {
        id: 1,
        nome: "React",
        categoria: "Tecnologia",
        nivel: "Intermediário",
        descricao: "Desenvolvimento de interfaces.",
        disponibilidade: "Projetos e freelas",
      },
    ];
    localStorage.setItem("marketfaesa-habilidades:conta-a", JSON.stringify(dados));

    render(<Habilidades usuarioId="conta-a" usuario={{ id: "conta-a", email: "ana@faesa.br" }} onNavigate={() => {}} />);

    expect(screen.getByRole("heading", { name: "React" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Incompleta" })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("marketfaesa-habilidades:conta-a"))).toHaveLength(4);
  });

  it("publica a habilidade e persiste os dados vinculados à conta", async () => {
    const user = userEvent.setup();
    render(<Habilidades usuarioId="conta-a" usuario={{ id: "conta-a", email: "ana@faesa.br" }} onNavigate={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Criar habilidade/ }));
    await user.type(screen.getByLabelText("Nome da habilidade"), "  React  ");
    await user.selectOptions(screen.getByLabelText("Categoria"), "Tecnologia");
    await user.selectOptions(screen.getByLabelText("Nível"), "Avançado");
    await user.type(screen.getByLabelText("Sobre esta habilidade"), "  Desenvolvimento de interfaces.  ");
    await user.click(screen.getByRole("button", { name: "Publicar habilidade" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Habilidade publicada com sucesso.");
    expect(screen.getByRole("heading", { name: "React" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("marketfaesa-habilidades:conta-a"))).toEqual([
      expect.objectContaining({
        nome: "React",
        categoria: "Tecnologia",
        nivel: "Avançado",
        descricao: "Desenvolvimento de interfaces.",
        disponibilidade: "Projetos e freelas",
      }),
    ]);
  });

  it("não mistura habilidades de contas diferentes", () => {
    localStorage.setItem(
      "marketfaesa-habilidades:conta-a",
      JSON.stringify([{ id: 1, nome: "Privada da conta A", categoria: "Tecnologia", nivel: "Avançado", descricao: "Descrição A", disponibilidade: "Colaborações" }]),
    );

    render(<Habilidades usuarioId="conta-b" usuario={{ id: "conta-b", email: "bruno@faesa.br" }} onNavigate={() => {}} />);

    expect(screen.getByRole("heading", { name: "Você ainda não publicou nenhuma habilidade" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Privada da conta A" })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("marketfaesa-habilidades:conta-a"))[0].nome).toBe("Privada da conta A");
    expect(localStorage.getItem("marketfaesa-habilidades:conta-b")).toBeNull();
  });

  it("não aceita nome ou descrição compostos apenas por espaços", async () => {
    const user = userEvent.setup();
    render(<Habilidades usuarioId="conta-a" usuario={{ id: "conta-a", email: "ana@faesa.br" }} onNavigate={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Criar habilidade/ }));
    await user.type(screen.getByLabelText("Nome da habilidade"), "   ");
    await user.type(screen.getByLabelText("Sobre esta habilidade"), "   ");
    await user.click(screen.getByRole("button", { name: "Publicar habilidade" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Preencha o nome e a descrição da habilidade.");
    expect(screen.queryByText("Habilidade publicada com sucesso.")).not.toBeInTheDocument();
    expect(localStorage.getItem("marketfaesa-habilidades:conta-a")).toBeNull();
  });

  it("abre o formulário pelo botão principal de criação", async () => {
    const user = userEvent.setup();
    render(<Habilidades usuarioId="conta-a" usuario={{ id: "conta-a", email: "ana@faesa.br" }} onNavigate={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Criar habilidade/ }));

    expect(screen.getByRole("heading", { name: "Criar uma habilidade" })).toBeInTheDocument();
  });
});
