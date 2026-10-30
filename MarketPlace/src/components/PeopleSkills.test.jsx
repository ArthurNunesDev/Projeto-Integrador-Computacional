import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PeopleSkills from "./PeopleSkills.jsx";
import { chamadas, erroApi, mockarApi, pessoa, pessoaResumo } from "../test/apiFalsa.js";

const BRUNO = pessoa(2, "Bruno Lima", [{ id: 20, nome: "Figma", categoria: "Design", nivel: "AVANCADO", disponibilidade: "COLABORACOES" }]);
const CARLA = pessoa(3, "Carla Dias", [{ id: 30, nome: "Contratos", categoria: "Direito", nivel: "INICIANTE", disponibilidade: "COLABORACOES" }]);

function rotas(extras = {}) {
  return {
    "GET /api/pessoas": [BRUNO, CARLA],
    "GET /api/conexoes": [],
    "GET /api/conexoes/recebidas": [],
    "GET /api/conexoes/enviadas": [],
    ...extras,
  };
}

afterEach(() => {
  cleanup();
});

describe("Habilidades (diretório de pessoas)", () => {
  it("lista as pessoas da API e filtra pelas categorias das habilidades", async () => {
    mockarApi(rotas());
    const user = userEvent.setup();
    render(<PeopleSkills />);

    expect(await screen.findByRole("heading", { name: "Bruno Lima" })).toBeInTheDocument();
    expect(screen.getAllByText("Ciência da Computação · 4º período")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Direito" }));

    expect(screen.queryByRole("heading", { name: "Bruno Lima" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Carla Dias" })).toBeInTheDocument();
  });

  it("conecta pelo perfil com POST /api/conexoes", async () => {
    const fetchFalso = mockarApi(rotas({
      "POST /api/conexoes": { id: 8, status: "PENDENTE", enviadaPorMim: true, pessoa: pessoaResumo(2, "Bruno Lima") },
    }));
    const user = userEvent.setup();
    render(<PeopleSkills />);

    await user.click(await screen.findByRole("button", { name: /Bruno Lima/ }));
    expect(screen.getByText("Nível Avançado")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "+ Conectar" }));

    expect(await screen.findByRole("button", { name: "Pedido enviado" })).toBeInTheDocument();
    expect(chamadas(fetchFalso, "POST /api/conexoes")).toEqual([{ destinatarioId: 2 }]);
  });

  it("mostra quem já está conectado e o erro quando a ação falha", async () => {
    mockarApi(rotas({
      "GET /api/conexoes": [{ id: 7, status: "ACEITA", enviadaPorMim: false, pessoa: pessoaResumo(2, "Bruno Lima") }],
      "DELETE /api/conexoes/7": erroApi(500, "Erro interno"),
    }));
    const user = userEvent.setup();
    render(<PeopleSkills />);

    await user.click(await screen.findByRole("button", { name: /Bruno Lima/ }));
    await user.click(await screen.findByRole("button", { name: "✓ Conectado" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Erro interno");
    expect(screen.getByRole("button", { name: "✓ Conectado" })).toBeInTheDocument();
  });
});
