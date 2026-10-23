import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Oportunidades from "./Opportunities.jsx";
import { chaveUsuario } from "../storage.js";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("Oportunidades", () => {
  it("inclui oportunidade de tecnologia em saúde no filtro Saúde", async () => {
    const user = userEvent.setup();
    render(<Oportunidades usuarioId="conta-a" />);

    await user.click(screen.getByRole("button", { name: "Saúde" }));

    expect(
      screen.getByRole("heading", { name: "Desenvolvimento de App para Clínica" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1", { selector: "strong" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Revisão Jurídica de Contratos Digitais" })).not.toBeInTheDocument();
  });

  it("mantém oportunidades salvas separadas por conta", async () => {
    const user = userEvent.setup();
    const chaveContaA = chaveUsuario("marketfaesa-salvos", "conta-a");
    const chaveContaB = chaveUsuario("marketfaesa-salvos", "conta-b");

    const { unmount } = render(<Oportunidades usuarioId="conta-a" />);
    const card = screen.getByRole("heading", { name: "Desenvolvimento de App para Clínica" }).closest("article");
    await user.click(within(card).getByRole("button", { name: "Salvar oportunidade" }));

    expect(JSON.parse(localStorage.getItem(chaveContaA))).toEqual([
      expect.objectContaining({ id: 1, titulo: "Desenvolvimento de App para Clínica" }),
    ]);

    unmount();
    render(<Oportunidades usuarioId="conta-b" />);
    const cardContaB = screen.getByRole("heading", { name: "Desenvolvimento de App para Clínica" }).closest("article");

    expect(within(cardContaB).getByRole("button", { name: "Salvar oportunidade" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(chaveContaB))).toEqual([]);
    expect(JSON.parse(localStorage.getItem(chaveContaA))).toEqual([
      expect.objectContaining({ id: 1, titulo: "Desenvolvimento de App para Clínica" }),
    ]);
  });
});

describe("persistência das ações em oportunidades", () => {
  it("salva e remove uma oportunidade no armazenamento da conta", async () => {
    const user = userEvent.setup();
    const chave = chaveUsuario("marketfaesa-salvos", "conta-a");
    render(<Oportunidades usuarioId="conta-a" />);
    const card = screen.getByRole("heading", { name: "Desenvolvimento de App para Clínica" }).closest("article");

    await user.click(within(card).getByRole("button", { name: "Salvar oportunidade" }));
    expect(JSON.parse(localStorage.getItem(chave))).toEqual([
      expect.objectContaining({ id: 1, titulo: "Desenvolvimento de App para Clínica" }),
    ]);

    await user.click(within(card).getByRole("button", { name: "Remover dos salvos" }));
    expect(JSON.parse(localStorage.getItem(chave))).toEqual([]);
  });

  it("persiste a participação e mantém o estado após remontar o componente", async () => {
    const user = userEvent.setup();
    const chave = chaveUsuario("marketfaesa-participando", "conta-a");
    const { unmount } = render(<Oportunidades usuarioId="conta-a" />);
    const card = screen.getByRole("heading", { name: "Desenvolvimento de App para Clínica" }).closest("article");
    await user.click(within(card).getByRole("button", { name: "Participar" }));

    expect(JSON.parse(localStorage.getItem(chave))).toEqual([1]);
    unmount();
    render(<Oportunidades usuarioId="conta-a" />);
    const cardNovamente = screen.getByRole("heading", { name: "Desenvolvimento de App para Clínica" }).closest("article");
    expect(within(cardNovamente).getByRole("button", { name: "✓ Participando" })).toBeInTheDocument();
  });

  it("não marca oportunidade como salva se o armazenamento falhar", async () => {
    const user = userEvent.setup();
    const originalSetItem = Storage.prototype.setItem;
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (key, value) {
      if (key === "marketfaesa-salvos:conta-a") throw new Error("Quota exceeded");
      return originalSetItem.call(this, key, value);
    });
    render(<Oportunidades usuarioId="conta-a" />);
    const card = screen.getByRole("heading", { name: "Desenvolvimento de App para Clínica" }).closest("article");

    await user.click(within(card).getByRole("button", { name: "Salvar oportunidade" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível atualizar suas oportunidades salvas");
    expect(within(card).getByRole("button", { name: "Salvar oportunidade" })).toBeInTheDocument();
    spy.mockRestore();
  });

  it("não confirma participação se o armazenamento falhar", async () => {
    const user = userEvent.setup();
    const originalSetItem = Storage.prototype.setItem;
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (key, value) {
      if (key === "marketfaesa-participando:conta-a") throw new Error("Quota exceeded");
      return originalSetItem.call(this, key, value);
    });
    render(<Oportunidades usuarioId="conta-a" />);
    const card = screen.getByRole("heading", { name: "Desenvolvimento de App para Clínica" }).closest("article");

    await user.click(within(card).getByRole("button", { name: "Participar" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível atualizar sua participação");
    expect(within(card).getByRole("button", { name: "Participar" })).toBeInTheDocument();
    spy.mockRestore();
  });

  it("mantém participações isoladas por conta", async () => {
    const user = userEvent.setup();
    const chaveA = chaveUsuario("marketfaesa-participando", "conta-a");
    const chaveB = chaveUsuario("marketfaesa-participando", "conta-b");
    const { unmount } = render(<Oportunidades usuarioId="conta-a" />);
    const cardA = screen.getByRole("heading", { name: "Desenvolvimento de App para Clínica" }).closest("article");
    await user.click(within(cardA).getByRole("button", { name: "Participar" }));
    unmount();
    render(<Oportunidades usuarioId="conta-b" />);
    const cardB = screen.getByRole("heading", { name: "Desenvolvimento de App para Clínica" }).closest("article");

    expect(within(cardB).getByRole("button", { name: "Participar" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(chaveA))).toEqual([1]);
    expect(JSON.parse(localStorage.getItem(chaveB))).toEqual([]);
  });
});

