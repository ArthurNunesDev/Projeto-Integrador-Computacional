import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Oportunidades from "./Opportunities.jsx";
import { AREAS, chamadas, erroApi, mockarApi, oportunidade, pessoaResumo } from "../test/apiFalsa.js";

const LISTA = [
  oportunidade(1, "App para Clínica", { areas: [AREAS[0], AREAS[1]] }),
  oportunidade(2, "Revisão de Contratos", { tipo: "CONSULTORIA", modalidade: "HIBRIDO", areas: [AREAS[2]] }),
  oportunidade(3, "Minha pesquisa", { tipo: "PESQUISA", autor: pessoaResumo(1, "Ana Souza") }),
];

afterEach(() => {
  cleanup();
});

function cardDe(titulo) {
  return screen.getByRole("heading", { name: titulo }).closest("article");
}

describe("Oportunidades", () => {
  it("lista as oportunidades da API com rótulos e filtra pelas áreas do catálogo", async () => {
    mockarApi({ "GET /api/oportunidades": LISTA, "GET /api/areas": AREAS });
    const user = userEvent.setup();
    render(<Oportunidades usuarioId={1} />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando oportunidades...");
    const card = await screen.findByRole("heading", { name: "Revisão de Contratos" });
    expect(within(card.closest("article")).getByText("◷ Híbrido")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Saúde" }));

    expect(screen.getByRole("heading", { name: "App para Clínica" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Revisão de Contratos" })).not.toBeInTheDocument();
    expect(screen.getByText("1", { selector: "strong" })).toBeInTheDocument();
  });

  it("salva e remove dos salvos com PUT e DELETE /salvo", async () => {
    const fetchFalso = mockarApi({
      "GET /api/oportunidades": LISTA,
      "GET /api/areas": AREAS,
      "PUT /api/oportunidades/1/salvo": null,
      "DELETE /api/oportunidades/1/salvo": null,
    });
    const user = userEvent.setup();
    render(<Oportunidades usuarioId={1} />);
    await screen.findByRole("heading", { name: "App para Clínica" });

    await user.click(within(cardDe("App para Clínica")).getByRole("button", { name: "Salvar oportunidade" }));
    expect(await within(cardDe("App para Clínica")).findByRole("button", { name: "Remover dos salvos" })).toBeInTheDocument();

    await user.click(within(cardDe("App para Clínica")).getByRole("button", { name: "Remover dos salvos" }));
    expect(await within(cardDe("App para Clínica")).findByRole("button", { name: "Salvar oportunidade" })).toBeInTheDocument();
    expect(chamadas(fetchFalso, "PUT /api/oportunidades/1/salvo")).toHaveLength(1);
    expect(chamadas(fetchFalso, "DELETE /api/oportunidades/1/salvo")).toHaveLength(1);
  });

  it("participa com POST /participacao e mostra o erro da API sem marcar", async () => {
    mockarApi({
      "GET /api/oportunidades": LISTA,
      "GET /api/areas": AREAS,
      "POST /api/oportunidades/1/participacao": null,
      "POST /api/oportunidades/2/participacao": erroApi(409, "Oportunidade fechada"),
    });
    const user = userEvent.setup();
    render(<Oportunidades usuarioId={1} />);
    await screen.findByRole("heading", { name: "App para Clínica" });

    await user.click(within(cardDe("App para Clínica")).getByRole("button", { name: "Participar" }));
    expect(await within(cardDe("App para Clínica")).findByRole("button", { name: "✓ Participando" })).toBeInTheDocument();

    await user.click(within(cardDe("Revisão de Contratos")).getByRole("button", { name: "Participar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Oportunidade fechada");
    expect(within(cardDe("Revisão de Contratos")).getByRole("button", { name: "Participar" })).toBeInTheDocument();
  });

  it("não oferece participar da própria oportunidade", async () => {
    mockarApi({ "GET /api/oportunidades": LISTA, "GET /api/areas": AREAS });
    render(<Oportunidades usuarioId={1} />);
    await screen.findByRole("heading", { name: "Minha pesquisa" });

    expect(within(cardDe("Minha pesquisa")).getByRole("button", { name: "Sua oportunidade" })).toBeDisabled();
  });

  it("mostra erro com opção de tentar de novo quando a lista falha", async () => {
    mockarApi({ "GET /api/oportunidades": erroApi(500, "Erro interno"), "GET /api/areas": AREAS });
    render(<Oportunidades usuarioId={1} />);

    expect(await screen.findByText("Não foi possível carregar as oportunidades")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});
