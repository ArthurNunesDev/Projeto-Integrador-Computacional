import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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

  it("mostra editar e excluir só na própria oportunidade, sem participar", async () => {
    mockarApi({ "GET /api/oportunidades": LISTA, "GET /api/areas": AREAS });
    render(<Oportunidades usuarioId={1} />);
    await screen.findByRole("heading", { name: "Minha pesquisa" });

    const minha = within(cardDe("Minha pesquisa"));
    expect(minha.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(minha.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
    expect(minha.queryByRole("button", { name: "Participar" })).not.toBeInTheDocument();
    expect(within(cardDe("App para Clínica")).queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
  });

  it("publica com POST enviando os códigos e mostra a nova oportunidade no topo", async () => {
    const fetchFalso = mockarApi({
      "GET /api/oportunidades": LISTA,
      "GET /api/areas": AREAS,
      "POST /api/oportunidades": (corpo) => oportunidade(10, corpo.titulo, { tipo: corpo.tipo, modalidade: corpo.modalidade, areas: [AREAS[1]], autor: pessoaResumo(1, "Ana Souza") }),
    });
    const user = userEvent.setup();
    render(<Oportunidades usuarioId={1} />);
    await screen.findByRole("heading", { name: "App para Clínica" });

    await user.click(screen.getByRole("button", { name: "+ Publicar oportunidade" }));
    const dialogo = within(screen.getByRole("dialog", { name: "Nova oportunidade" }));
    await user.type(dialogo.getByRole("textbox", { name: "Título" }), "  Site da Atlética ");
    await user.selectOptions(dialogo.getByRole("combobox", { name: "Tipo" }), "CONSULTORIA");
    await user.selectOptions(dialogo.getByRole("combobox", { name: "Modalidade" }), "Presencial");
    await user.type(dialogo.getByRole("textbox", { name: "Descrição" }), "Landing page da atlética.");
    await user.click(dialogo.getByRole("checkbox", { name: "Saúde" }));
    await user.click(dialogo.getByRole("button", { name: "Publicar" }));

    expect(await screen.findByRole("heading", { name: "Site da Atlética" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")[0]).toHaveTextContent("Site da Atlética");
    expect(chamadas(fetchFalso, "POST /api/oportunidades")).toEqual([{
      tipo: "CONSULTORIA", titulo: "Site da Atlética", descricao: "Landing page da atlética.",
      modalidade: "PRESENCIAL", status: "ABERTA", areaIds: [2],
    }]);
  });

  it("edita com PUT a partir dos dados do card, incluindo status e áreas", async () => {
    const fetchFalso = mockarApi({
      "GET /api/oportunidades": LISTA,
      "GET /api/areas": AREAS,
      "PUT /api/oportunidades/3": (corpo) => oportunidade(3, corpo.titulo, { tipo: "PESQUISA", status: corpo.status, autor: pessoaResumo(1, "Ana Souza") }),
    });
    const user = userEvent.setup();
    render(<Oportunidades usuarioId={1} />);
    await screen.findByRole("heading", { name: "Minha pesquisa" });

    await user.click(within(cardDe("Minha pesquisa")).getByRole("button", { name: "Editar" }));
    const dialogo = within(screen.getByRole("dialog", { name: "Editar oportunidade" }));
    expect(dialogo.getByRole("checkbox", { name: "Tecnologia" })).toBeChecked();
    await user.clear(dialogo.getByRole("textbox", { name: "Título" }));
    await user.type(dialogo.getByRole("textbox", { name: "Título" }), "Pesquisa de campo");
    await user.selectOptions(dialogo.getByRole("combobox", { name: "Status" }), "Encerrada");
    await user.click(dialogo.getByRole("checkbox", { name: "Direito" }));
    await user.click(dialogo.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("heading", { name: "Pesquisa de campo" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Minha pesquisa" })).not.toBeInTheDocument();
    expect(chamadas(fetchFalso, "PUT /api/oportunidades/3")).toEqual([{
      tipo: "PESQUISA", titulo: "Pesquisa de campo", descricao: "Descrição de Minha pesquisa",
      modalidade: "REMOTO", status: "FECHADA", areaIds: [1, 3],
    }]);
  });

  it("mantém o formulário aberto e mostra o erro sem área ou quando a API recusa", async () => {
    const fetchFalso = mockarApi({
      "GET /api/oportunidades": LISTA,
      "GET /api/areas": AREAS,
      "POST /api/oportunidades": erroApi(400, "Dados inválidos"),
    });
    const user = userEvent.setup();
    render(<Oportunidades usuarioId={1} />);
    await screen.findByRole("heading", { name: "App para Clínica" });

    await user.click(screen.getByRole("button", { name: "+ Publicar oportunidade" }));
    const dialogo = within(screen.getByRole("dialog"));
    await user.type(dialogo.getByRole("textbox", { name: "Título" }), "Sem área");
    await user.type(dialogo.getByRole("textbox", { name: "Descrição" }), "Teste");
    await user.click(dialogo.getByRole("button", { name: "Publicar" }));
    expect(dialogo.getByRole("alert")).toHaveTextContent("escolha ao menos uma área");
    expect(chamadas(fetchFalso, "POST /api/oportunidades")).toHaveLength(0);

    await user.click(dialogo.getByRole("checkbox", { name: "Tecnologia" }));
    await user.click(dialogo.getByRole("button", { name: "Publicar" }));

    expect(await dialogo.findByText("Dados inválidos")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sem área" })).not.toBeInTheDocument();
  });

  it("exclui com DELETE somente após confirmar", async () => {
    const fetchFalso = mockarApi({
      "GET /api/oportunidades": LISTA,
      "GET /api/areas": AREAS,
      "DELETE /api/oportunidades/3": null,
    });
    const user = userEvent.setup();
    render(<Oportunidades usuarioId={1} />);
    await screen.findByRole("heading", { name: "Minha pesquisa" });

    await user.click(within(cardDe("Minha pesquisa")).getByRole("button", { name: "Excluir" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("heading", { name: "Minha pesquisa" })).toBeInTheDocument();

    await user.click(within(cardDe("Minha pesquisa")).getByRole("button", { name: "Excluir" }));
    await user.click(screen.getByRole("button", { name: "Sim, excluir" }));

    await waitFor(() => expect(screen.queryByRole("heading", { name: "Minha pesquisa" })).not.toBeInTheDocument());
    expect(chamadas(fetchFalso, "DELETE /api/oportunidades/3")).toHaveLength(1);
  });

  it("mostra erro com opção de tentar de novo quando a lista falha", async () => {
    mockarApi({ "GET /api/oportunidades": erroApi(500, "Erro interno"), "GET /api/areas": AREAS });
    render(<Oportunidades usuarioId={1} />);

    expect(await screen.findByText("Não foi possível carregar as oportunidades")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});
