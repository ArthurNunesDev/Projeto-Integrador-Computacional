import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Salvos from "./Saved.jsx";
import { chamadas, erroApi, mockarApi, oportunidade } from "../test/apiFalsa.js";

const SALVAS = [
  oportunidade(1, "App para Clínica", { salva: true }),
  oportunidade(2, "Revisão de Contratos", { salva: true }),
];

afterEach(() => {
  cleanup();
});

describe("Salvos", () => {
  it("lista GET /api/usuarios/me/salvos e filtra pelo título", async () => {
    mockarApi({ "GET /api/usuarios/me/salvos": SALVAS });
    const user = userEvent.setup();
    render(<Salvos onNavigate={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "App para Clínica" })).toBeInTheDocument();
    await user.type(screen.getByRole("searchbox", { name: "Buscar nos salvos" }), "Contratos");

    expect(screen.queryByRole("heading", { name: "App para Clínica" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Revisão de Contratos" })).toBeInTheDocument();
  });

  it("remove com DELETE /salvo e mantém o item quando a API falha", async () => {
    const fetchFalso = mockarApi({
      "GET /api/usuarios/me/salvos": SALVAS,
      "DELETE /api/oportunidades/1/salvo": null,
      "DELETE /api/oportunidades/2/salvo": erroApi(500, "Erro interno"),
    });
    const user = userEvent.setup();
    render(<Salvos onNavigate={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: "Remover App para Clínica dos salvos" }));
    expect(await screen.findByText("oportunidade salva")).toBeInTheDocument();
    expect(chamadas(fetchFalso, "DELETE /api/oportunidades/1/salvo")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Remover Revisão de Contratos dos salvos" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Erro interno");
    expect(screen.getByRole("heading", { name: "Revisão de Contratos" })).toBeInTheDocument();
  });

  it("oferece navegação quando a lista está vazia", async () => {
    mockarApi({ "GET /api/usuarios/me/salvos": [] });
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<Salvos onNavigate={onNavigate} />);

    await user.click(await screen.findByRole("button", { name: "Encontrar oportunidades" }));

    expect(screen.getByRole("heading", { name: "Você ainda não salvou nada" })).toBeInTheDocument();
    expect(onNavigate).toHaveBeenCalledWith("oportunidades");
  });
});
