import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Body from "./Body.jsx";
import {
  AREAS, chamadas, erroApi, habilidadePublicada, mockarApi, oportunidade, pessoa, pessoaResumo, USUARIO,
} from "../test/apiFalsa.js";

function rotas(extras = {}) {
  return {
    "GET /api/oportunidades": [
      oportunidade(1, "App para Clínica", { areas: [AREAS[1]] }),
      oportunidade(2, "Análise de Dados", { status: "FECHADA" }),
    ],
    "GET /api/areas": AREAS,
    "GET /api/habilidades-publicadas": [
      habilidadePublicada(1, "React"),
      habilidadePublicada(2, "Figma", { categoria: "Design", usuario: pessoaResumo(2, "Bruno Lima") }),
      habilidadePublicada(3, "Vue", { usuario: pessoaResumo(2, "Bruno Lima") }),
    ],
    "GET /api/pessoas": [pessoa(2, "Bruno Lima"), pessoa(3, "Carla Dias")],
    "GET /api/conexoes": [{ id: 1, status: "ACEITA", pessoa: pessoaResumo(2, "Bruno Lima") }],
    "GET /api/usuarios/me/participacoes": [],
    ...extras,
  };
}

afterEach(() => {
  cleanup();
});

describe("Página inicial", () => {
  it("mostra números e destaques calculados a partir da API", async () => {
    mockarApi(rotas());
    render(<Body onNavigate={vi.fn()} usuario={USUARIO} />);

    expect(await screen.findByRole("heading", { name: "App para Clínica" })).toBeInTheDocument();
    const estudantes = (await screen.findByText("Estudantes ativos")).closest(".stat-card");
    expect(within(estudantes).getByText("3")).toBeInTheDocument();
    const abertas = screen.getByText("Oportunidades abertas").closest(".stat-card");
    expect(within(abertas).getByText("1")).toBeInTheDocument();
    const popular = screen.getByRole("heading", { name: /Categorias com mais habilidades/ }).closest("section");
    expect(within(popular).getAllByRole("listitem")[0]).toHaveTextContent("Tecnologia2 habilidades");
    expect(within(screen.getByText("Conexões").closest("div")).getByText("1")).toBeInTheDocument();
  });

  it("filtra os destaques pela área e desabilita participar de oportunidade encerrada", async () => {
    mockarApi(rotas());
    const user = userEvent.setup();
    render(<Body onNavigate={vi.fn()} usuario={USUARIO} />);
    await screen.findByRole("heading", { name: "Análise de Dados" });

    const encerrada = screen.getByRole("heading", { name: "Análise de Dados" }).closest("article");
    expect(within(encerrada).getByRole("button", { name: "Encerrada" })).toBeDisabled();

    await user.click(await screen.findByRole("button", { name: "Saúde" }));
    expect(screen.queryByRole("heading", { name: "Análise de Dados" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "App para Clínica" })).toBeInTheDocument();
  });

  it("salva pela API e não marca quando a chamada falha", async () => {
    const fetchFalso = mockarApi(rotas({
      "PUT /api/oportunidades/1/salvo": null,
      "PUT /api/oportunidades/2/salvo": erroApi(404, "Oportunidade não encontrada"),
    }));
    const user = userEvent.setup();
    render(<Body onNavigate={vi.fn()} usuario={USUARIO} />);
    await screen.findByRole("heading", { name: "App para Clínica" });

    const card = screen.getByRole("heading", { name: "App para Clínica" }).closest("article");
    await user.click(within(card).getByRole("button", { name: "Salvar oportunidade" }));
    expect(await within(card).findByRole("button", { name: "Remover dos salvos" })).toBeInTheDocument();
    expect(chamadas(fetchFalso, "PUT /api/oportunidades/1/salvo")).toHaveLength(1);

    const outro = screen.getByRole("heading", { name: "Análise de Dados" }).closest("article");
    await user.click(within(outro).getByRole("button", { name: "Salvar oportunidade" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Oportunidade não encontrada");
    expect(within(outro).getByRole("button", { name: "Salvar oportunidade" })).toBeInTheDocument();
  });

  it("participa pelo modal de detalhes", async () => {
    const fetchFalso = mockarApi(rotas({ "POST /api/oportunidades/1/participacao": null }));
    const user = userEvent.setup();
    render(<Body onNavigate={vi.fn()} usuario={USUARIO} />);
    await screen.findByRole("heading", { name: "App para Clínica" });

    await user.click(screen.getByRole("button", { name: "Ver detalhes de App para Clínica" }));
    const modal = screen.getByRole("dialog");
    await user.click(within(modal).getByRole("button", { name: "Participar" }));

    expect(await within(modal).findByRole("button", { name: "✓ Participando" })).toBeInTheDocument();
    expect(chamadas(fetchFalso, "POST /api/oportunidades/1/participacao")).toHaveLength(1);
  });
});
