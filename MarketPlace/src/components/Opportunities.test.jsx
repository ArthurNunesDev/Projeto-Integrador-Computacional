import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
