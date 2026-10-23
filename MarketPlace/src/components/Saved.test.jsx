import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Salvos from "./Saved.jsx";
import { chaveUsuario } from "../storage.js";

const oportunidadeA = {
  id: 1,
  icon: "💻",
  tipo: "PROJETO",
  titulo: "Desenvolvimento de App para Clínica",
  area: "Tecnologia",
  modalidade: "Remoto",
  pessoa: "Maria Lima",
  curso: "Medicina",
  inicial: "ML",
  descricao: "Apoio na criação de um aplicativo.",
};
const oportunidadeB = {
  id: 2,
  icon: "🎨",
  tipo: "DESIGN",
  titulo: "Criação de identidade visual",
  area: "Design",
  modalidade: "Híbrido",
  pessoa: "Lucas Martins",
  curso: "Design",
  inicial: "LM",
  descricao: "Identidade visual para projeto estudantil.",
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(chaveUsuario("marketfaesa-salvos", "conta-a"), JSON.stringify([oportunidadeA, oportunidadeB]));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Salvos", () => {
  it("remove um item e persiste a lista atualizada da conta", async () => {
    const user = userEvent.setup();
    const chave = chaveUsuario("marketfaesa-salvos", "conta-a");
    render(<Salvos usuarioId="conta-a" />);

    await user.click(screen.getByRole("button", { name: "Remover Desenvolvimento de App para Clínica dos salvos" }));

    expect(screen.queryByRole("heading", { name: oportunidadeA.titulo })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(chave))).toEqual([oportunidadeB]);
    expect(screen.getByText("1", { selector: "strong" })).toBeInTheDocument();
  });

  it("mantém a oportunidade e mostra erro se a gravação falhar", async () => {
    const user = userEvent.setup();
    const chave = chaveUsuario("marketfaesa-salvos", "conta-a");
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (key, value) {
      if (key === chave) throw new Error("Quota exceeded");
      return originalSetItem.call(this, key, value);
    });
    render(<Salvos usuarioId="conta-a" />);

    await user.click(screen.getByRole("button", { name: "Remover Desenvolvimento de App para Clínica dos salvos" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível remover esta oportunidade");
    expect(screen.getByRole("heading", { name: oportunidadeA.titulo })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(chave))).toEqual([oportunidadeA, oportunidadeB]);
  });

  it("filtra pelo título e mostra estado vazio quando não há correspondências", async () => {
    const user = userEvent.setup();
    render(<Salvos usuarioId="conta-a" />);

    await user.type(screen.getByRole("searchbox", { name: "Buscar nos salvos" }), "que não existe");

    expect(screen.getByRole("heading", { name: "Nenhum salvo encontrado" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: oportunidadeA.titulo })).not.toBeInTheDocument();
  });

  it("navega para oportunidades pelos botões de explorar e ver oportunidade", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Salvos usuarioId="conta-a" onNavigate={onNavigate} />);

    const card = screen.getByRole("heading", { name: oportunidadeA.titulo }).closest("article");
    await user.click(within(card).getByRole("button", { name: "Ver oportunidade" }));
    expect(onNavigate).toHaveBeenLastCalledWith("oportunidades");

    await user.click(screen.getByRole("button", { name: /Explorar oportunidades/ }));
    expect(onNavigate).toHaveBeenLastCalledWith("oportunidades");
  });

  it("mantém os salvos isolados por conta", () => {
    const chaveB = chaveUsuario("marketfaesa-salvos", "conta-b");
    const { unmount } = render(<Salvos usuarioId="conta-a" />);
    expect(screen.getByRole("heading", { name: oportunidadeA.titulo })).toBeInTheDocument();

    unmount();
    render(<Salvos usuarioId="conta-b" />);

    expect(screen.getByRole("heading", { name: "Você ainda não salvou nada" })).toBeInTheDocument();
    expect(localStorage.getItem(chaveB)).toBeNull();
    expect(JSON.parse(localStorage.getItem(chaveUsuario("marketfaesa-salvos", "conta-a")))).toEqual([oportunidadeA, oportunidadeB]);
  });

  it("ignora registros inválidos no armazenamento sem quebrar a tela", () => {
    const chave = chaveUsuario("marketfaesa-salvos", "conta-a");
    localStorage.setItem(chave, JSON.stringify([null, 42, { id: 3 }, oportunidadeB]));
    render(<Salvos usuarioId="conta-a" />);

    expect(screen.getByRole("heading", { name: oportunidadeB.titulo })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: oportunidadeA.titulo })).not.toBeInTheDocument();
    expect(screen.getByText("1", { selector: "strong" })).toBeInTheDocument();
  });

  it("oferece navegação quando a lista está vazia", async () => {
    const user = userEvent.setup();
    localStorage.setItem(chaveUsuario("marketfaesa-salvos", "conta-a"), "[]");
    const onNavigate = vi.fn();
    render(<Salvos usuarioId="conta-a" onNavigate={onNavigate} />);

    expect(screen.getByRole("heading", { name: "Você ainda não salvou nada" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Encontrar oportunidades" }));
    expect(onNavigate).toHaveBeenCalledWith("oportunidades");
  });
});
