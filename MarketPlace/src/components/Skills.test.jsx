import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Habilidades from "./Skills.jsx";
import { chamadas, erroApi, habilidadePublicada, mockarApi, USUARIO } from "../test/apiFalsa.js";

afterEach(() => {
  cleanup();
});

function renderizar(minhas, rotas = {}) {
  const fetchFalso = mockarApi({ "GET /api/habilidades-publicadas?usuarioId=1": minhas, ...rotas });
  render(<Habilidades usuario={USUARIO} onNavigate={() => {}} />);
  return fetchFalso;
}

describe("Habilidades (publicar)", () => {
  it("mostra uma mensagem orientativa quando a conta ainda não tem habilidades", async () => {
    renderizar([]);

    expect(await screen.findByRole("heading", { name: "Você ainda não publicou nenhuma habilidade" })).toBeInTheDocument();
  });

  it("exibe as habilidades publicadas pelo usuário", async () => {
    renderizar([habilidadePublicada(1, "React", { nivel: "INTERMEDIARIO" })]);

    expect(await screen.findByRole("heading", { name: "React" })).toBeInTheDocument();
    expect(screen.getByText("Intermediário")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Você ainda não publicou nenhuma habilidade" })).not.toBeInTheDocument();
  });

  it("publica com POST enviando os códigos e mostra a habilidade criada", async () => {
    const fetchFalso = renderizar([], {
      "POST /api/habilidades-publicadas": (corpo) => habilidadePublicada(9, corpo.nome, corpo),
    });
    const user = userEvent.setup();
    await screen.findByRole("heading", { name: "Você ainda não publicou nenhuma habilidade" });

    await user.click(screen.getByRole("button", { name: "+ Criar habilidade" }));
    await user.type(screen.getByPlaceholderText("Ex.: Desenvolvimento Web"), "Figma");
    await user.selectOptions(screen.getByRole("combobox", { name: "Categoria" }), "Design");
    await user.selectOptions(screen.getByRole("combobox", { name: "Nível" }), "Avançado");
    await user.selectOptions(screen.getByRole("combobox", { name: "Disponibilidade" }), "Colaborações");
    await user.type(screen.getByRole("textbox", { name: "Sobre esta habilidade" }), "Protótipos e interfaces.");
    await user.click(screen.getByRole("button", { name: "Publicar habilidade" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Habilidade publicada com sucesso.");
    expect(screen.getByRole("heading", { name: "Figma" })).toBeInTheDocument();
    expect(chamadas(fetchFalso, "POST /api/habilidades-publicadas")).toEqual([{
      nome: "Figma", categoria: "Design", nivel: "AVANCADO",
      descricao: "Protótipos e interfaces.", disponibilidade: "COLABORACOES",
    }]);
  });

  it("não aceita nome ou descrição compostos apenas por espaços", async () => {
    const fetchFalso = renderizar([]);
    const user = userEvent.setup();
    await screen.findByRole("heading", { name: "Você ainda não publicou nenhuma habilidade" });

    await user.click(screen.getByRole("button", { name: "+ Criar habilidade" }));
    await user.type(screen.getByPlaceholderText("Ex.: Desenvolvimento Web"), "   ");
    await user.type(screen.getByRole("textbox", { name: "Sobre esta habilidade" }), "   ");
    await user.click(screen.getByRole("button", { name: "Publicar habilidade" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Preencha o nome e a descrição da habilidade.");
    expect(chamadas(fetchFalso, "POST /api/habilidades-publicadas")).toHaveLength(0);
  });

  it("mantém o formulário e mostra o erro quando o POST falha", async () => {
    renderizar([], { "POST /api/habilidades-publicadas": erroApi(400, "Dados inválidos") });
    const user = userEvent.setup();
    await screen.findByRole("heading", { name: "Você ainda não publicou nenhuma habilidade" });

    await user.click(screen.getByRole("button", { name: "+ Criar habilidade" }));
    await user.type(screen.getByPlaceholderText("Ex.: Desenvolvimento Web"), "Figma");
    await user.type(screen.getByRole("textbox", { name: "Sobre esta habilidade" }), "Interfaces.");
    await user.click(screen.getByRole("button", { name: "Publicar habilidade" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Dados inválidos");
    expect(screen.getByPlaceholderText("Ex.: Desenvolvimento Web")).toHaveValue("Figma");
  });
});
