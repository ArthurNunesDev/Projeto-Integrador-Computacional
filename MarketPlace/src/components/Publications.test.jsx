import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MinhasPublicacoes from "./Publications.jsx";
import { chamadas, erroApi, habilidadePublicada, mockarApi } from "../test/apiFalsa.js";

const REACT = habilidadePublicada(1, "React", { nivel: "INTERMEDIARIO", descricao: "Desenvolvimento de interfaces." });

afterEach(() => {
  cleanup();
});

function renderizar(rotas = {}) {
  const fetchFalso = mockarApi({ "GET /api/habilidades-publicadas?usuarioId=1": [REACT], ...rotas });
  render(<MinhasPublicacoes usuarioId={1} />);
  return fetchFalso;
}

describe("Minhas Publicações", () => {
  it("lista as habilidades do usuário com os rótulos de nível e disponibilidade", async () => {
    renderizar();

    expect(await screen.findByRole("heading", { name: "React" })).toBeInTheDocument();
    expect(screen.getByText("Intermediário")).toBeInTheDocument();
    expect(screen.getByText("projetos e freelas")).toBeInTheDocument();
  });

  it("expõe o diálogo, fecha com Escape e devolve o foco ao botão que abriu", async () => {
    renderizar();
    const user = userEvent.setup();

    const botaoEditar = await screen.findByRole("button", { name: "Editar" });
    await user.click(botaoEditar);

    expect(screen.getByRole("dialog", { name: "React" })).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("textbox", { name: "Nome" })).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(botaoEditar).toHaveFocus();
  });

  it("edita com PUT enviando os códigos dos enums", async () => {
    const fetchFalso = renderizar({
      "PUT /api/habilidades-publicadas/1": (corpo) => ({ ...REACT, ...corpo }),
    });
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Editar" }));
    await user.clear(screen.getByRole("textbox", { name: "Nome" }));
    await user.type(screen.getByRole("textbox", { name: "Nome" }), "React Avançado");
    await user.selectOptions(screen.getByRole("combobox", { name: "Nível" }), "Especialista");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("heading", { name: "React Avançado" })).toBeInTheDocument();
    expect(chamadas(fetchFalso, "PUT /api/habilidades-publicadas/1")).toEqual([{
      nome: "React Avançado", categoria: "Tecnologia", nivel: "ESPECIALISTA",
      descricao: "Desenvolvimento de interfaces.", disponibilidade: "PROJETOS_FREELAS",
    }]);
  });

  it("mantém a edição aberta e mostra o erro quando o PUT falha", async () => {
    renderizar({ "PUT /api/habilidades-publicadas/1": erroApi(403, "Você não pode alterar esta habilidade") });
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Editar" }));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Você não pode alterar esta habilidade");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("exclui com DELETE somente após confirmar", async () => {
    const fetchFalso = renderizar({ "DELETE /api/habilidades-publicadas/1": null });
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Excluir" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("heading", { name: "React" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Excluir" }));
    await user.click(screen.getByRole("button", { name: "Sim, excluir" }));

    expect(await screen.findByText("Você ainda não publicou nada")).toBeInTheDocument();
    expect(chamadas(fetchFalso, "DELETE /api/habilidades-publicadas/1")).toHaveLength(1);
  });
});
