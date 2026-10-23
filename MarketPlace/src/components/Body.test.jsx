import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as storage from "../storage.js";
import Body from "./Body.jsx";

const usuario = {
  id: "conta-a",
  nome: "Ana Souza",
  email: "ana@example.com",
  curso: "ADS",
  periodo: "3º período",
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Página inicial — persistência das oportunidades", () => {
  it("ignora oportunidades salvas inválidas sem quebrar a página inicial", () => {
    localStorage.setItem("marketfaesa-salvos:conta-a", JSON.stringify([
      null,
      42,
      { id: 1 },
      {
        icon: "💻",
        tipo: "PROJETO",
        titulo: "Desenvolvimento de App para Clínica",
        area: "Saúde + TI",
        categorias: ["Saúde", "Tecnologia"],
        modalidade: "Remoto",
        pessoa: "Maria Lima",
        curso: "Medicina",
        id: 1,
        inicial: "ML",
        descricao: "Apoio na criação de um aplicativo para organização de atendimentos.",
      },
    ]));

    render(<Body usuario={usuario} onNavigate={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Remover dos salvos" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Salvar oportunidade" })).toHaveLength(3);
  });

  it("não marca oportunidade como salva quando o armazenamento falha", async () => {
    vi.spyOn(storage, "salvarValorSeguro").mockReturnValue(false);
    const user = userEvent.setup();
    render(<Body usuario={usuario} onNavigate={vi.fn()} />);

    await user.click(screen.getAllByRole("button", { name: "Salvar oportunidade" })[0]);

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível salvar esta alteração");
    expect(screen.getAllByRole("button", { name: "Salvar oportunidade" })).toHaveLength(4);
  });

  it("não marca participação quando o armazenamento falha", async () => {
    vi.spyOn(storage, "salvarValorSeguro").mockReturnValue(false);
    const user = userEvent.setup();
    render(<Body usuario={usuario} onNavigate={vi.fn()} />);

    const botoesParticipar = screen.getAllByRole("button", { name: "Participar" });
    await user.click(botoesParticipar[0]);

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível salvar esta alteração");
    expect(screen.getAllByRole("button", { name: "Participar" })).toHaveLength(4);
    expect(screen.queryByRole("button", { name: "✓ Participando" })).not.toBeInTheDocument();
  });

  it("persiste e atualiza a interface quando salvar uma oportunidade funciona", async () => {
    const user = userEvent.setup();
    render(<Body usuario={usuario} onNavigate={vi.fn()} />);

    await user.click(screen.getAllByRole("button", { name: "Salvar oportunidade" })[0]);

    expect(screen.getByRole("button", { name: "Remover dos salvos" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("marketfaesa-salvos:conta-a"))).toHaveLength(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("persiste a participação quando o armazenamento funciona", async () => {
    const user = userEvent.setup();
    render(<Body usuario={usuario} onNavigate={vi.fn()} />);

    await user.click(screen.getAllByRole("button", { name: "Participar" })[0]);

    expect(screen.getByRole("button", { name: "✓ Participando" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("marketfaesa-participando:conta-a"))).toEqual([1]);
  });
});
