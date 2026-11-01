import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Perfil from "./Profile.jsx";
import { CURSO, habilidadePublicada, mockarApi, pessoaResumo, USUARIO } from "../test/apiFalsa.js";

beforeEach(() => {
  localStorage.clear();
  mockarApi({
    "GET /api/habilidades-publicadas?usuarioId=1": [
      habilidadePublicada(1, "React"),
      habilidadePublicada(2, "Figma", { categoria: "Design" }),
    ],
    "GET /api/conexoes": [{ id: 7, status: "ACEITA", enviadaPorMim: true, pessoa: pessoaResumo(2, "Bruno Lima") }],
    "GET /api/usuarios/me/participacoes": [],
    "GET /api/cursos": [CURSO, { id: 6, nome: "Direito" }],
  });
});

afterEach(() => {
  cleanup();
});

function renderizar(onUpdateUsuario = vi.fn(async () => ({ sucesso: true }))) {
  render(<Perfil onNavigate={vi.fn()} perfilPublico mostrarEmail={false} usuario={USUARIO} onUpdateUsuario={onUpdateUsuario} />);
  return onUpdateUsuario;
}

describe("Meu Perfil", () => {
  it("mostra dados do usuário e números vindos da API", async () => {
    renderizar();

    expect(screen.getByRole("heading", { name: /Ana Souza/ })).toBeInTheDocument();
    expect(await screen.findByText("Figma", { selector: ".perfil-skill" })).toBeInTheDocument();
    expect(screen.getByText("Conexões").previousSibling).toHaveTextContent("1");
    expect(screen.getByText("Publicações").previousSibling).toHaveTextContent("2");
    expect(screen.getByText("Design", { selector: ".perfil-interest span" })).toBeInTheDocument();
  });

  it("salva pelo PUT do perfil com curso e período do catálogo", async () => {
    const onUpdateUsuario = renderizar();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "✎ Editar perfil" }));
    await user.selectOptions(await screen.findByLabelText("Curso"), "Direito");
    await user.selectOptions(screen.getByLabelText("Período / semestre"), "5º período");
    await user.type(screen.getByRole("textbox", { name: /Sobre você/ }), "Olá!");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(onUpdateUsuario).toHaveBeenCalledWith({ nome: "Ana Souza", cursoId: 6, periodo: 5, cidade: "Vitória", bio: "Olá!" });
    expect(await screen.findByRole("status")).toHaveTextContent("Perfil atualizado e salvo");
  });

  it("mantém a edição aberta e mostra o erro da API", async () => {
    renderizar(vi.fn(async () => ({ sucesso: false, mensagem: "Dados inválidos" })));
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "✎ Editar perfil" }));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Dados inválidos");
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });

  it("exige nome antes de salvar", async () => {
    const onUpdateUsuario = renderizar();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "✎ Editar perfil" }));
    await user.clear(screen.getByLabelText("Nome completo"));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Informe seu nome completo");
    expect(onUpdateUsuario).not.toHaveBeenCalled();
  });
});
