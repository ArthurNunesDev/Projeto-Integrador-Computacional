import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MinhasPublicacoes from "./Publications.jsx";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    "marketfaesa-habilidades:conta-a",
    JSON.stringify([
      {
        id: 1,
        nome: "React",
        categoria: "Tecnologia",
        nivel: "Intermediário",
        descricao: "Desenvolvimento de interfaces.",
        disponibilidade: "Projetos e freelas",
      },
    ]),
  );
});

afterEach(() => {
  cleanup();
});

describe("modal de edição de publicações", () => {
  it("expõe o diálogo, fecha com Escape e devolve o foco ao botão que abriu", async () => {
    const user = userEvent.setup();
    render(<MinhasPublicacoes usuarioId="conta-a" />);

    const botaoEditar = screen.getByRole("button", { name: "Editar" });
    await user.click(botaoEditar);

    const dialogo = screen.getByRole("dialog", { name: "React" });
    expect(dialogo).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("textbox", { name: "Nome" })).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(botaoEditar).toHaveFocus();
  });

  it("fecha ao clicar no fundo do modal, mas não ao clicar dentro do formulário", async () => {
    const user = userEvent.setup();
    render(<MinhasPublicacoes usuarioId="conta-a" />);

    await user.click(screen.getByRole("button", { name: "Editar" }));
    const dialogo = screen.getByRole("dialog", { name: "React" });

    await user.click(screen.getByRole("textbox", { name: "Nome" }));
    expect(dialogo).toBeInTheDocument();

    await user.click(document.querySelector(".publication-modal-backdrop"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});


describe("confirmação de exclusão de publicações", () => {
  it("mostra um diálogo formatado e mantém a publicação ao cancelar", async () => {
    const user = userEvent.setup();
    render(<MinhasPublicacoes usuarioId="conta-a" />);

    await user.click(screen.getByRole("button", { name: "Excluir" }));

    const dialogo = screen.getByRole("dialog", { name: "Excluir publicação?" });
    expect(dialogo).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText(/Você está prestes a excluir/)).toBeInTheDocument();
    expect(document.querySelector(".publication-delete-modal")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "React" })).toBeInTheDocument();
  });

  it("remove a publicação somente após confirmar a exclusão", async () => {
    const user = userEvent.setup();
    render(<MinhasPublicacoes usuarioId="conta-a" />);

    await user.click(screen.getByRole("button", { name: "Excluir" }));
    await user.click(screen.getByRole("button", { name: "Sim, excluir" }));

    expect(screen.queryByRole("heading", { name: "React" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Você ainda não publicou nada" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("marketfaesa-habilidades:conta-a"))).toEqual([]);
  });
});

describe("persistência das alterações de publicações", () => {
  it("edita e salva os campos atualizados vinculados à conta", async () => {
    const user = userEvent.setup();
    render(<MinhasPublicacoes usuarioId="conta-a" />);
    await user.click(screen.getByRole("button", { name: "Editar" }));
    const nome = screen.getByRole("textbox", { name: "Nome" });
    await user.clear(nome);
    await user.type(nome, "React avançado");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(screen.getByRole("heading", { name: "React avançado" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("marketfaesa-habilidades:conta-a"))[0].nome).toBe("React avançado");
  });

  it("não fecha a edição nem altera a tela quando o armazenamento falha", async () => {
    const user = userEvent.setup();
    render(<MinhasPublicacoes usuarioId="conta-a" />);
    await user.click(screen.getByRole("button", { name: "Editar" }));
    const nome = screen.getByRole("textbox", { name: "Nome" });
    await user.clear(nome);
    await user.type(nome, "React alterado");
    const originalSetItem = Storage.prototype.setItem;
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (key, value) {
      if (key === "marketfaesa-habilidades:conta-a") throw new Error("Quota exceeded");
      return originalSetItem.call(this, key, value);
    });

    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível salvar as alterações");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("marketfaesa-habilidades:conta-a"))[0].nome).toBe("React");
    spy.mockRestore();
  });

  it("não exclui a publicação nem fecha a confirmação quando o armazenamento falha", async () => {
    const user = userEvent.setup();
    render(<MinhasPublicacoes usuarioId="conta-a" />);
    await user.click(screen.getByRole("button", { name: "Excluir" }));
    const originalSetItem = Storage.prototype.setItem;
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (key, value) {
      if (key === "marketfaesa-habilidades:conta-a") throw new Error("Quota exceeded");
      return originalSetItem.call(this, key, value);
    });

    await user.click(screen.getByRole("button", { name: "Sim, excluir" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível excluir a publicação");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "React" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("marketfaesa-habilidades:conta-a"))).toHaveLength(1);
    spy.mockRestore();
  });

  it("não altera publicações de outra conta ao editar", async () => {
    const user = userEvent.setup();
    localStorage.setItem("marketfaesa-habilidades:conta-b", JSON.stringify([
      { id: 2, nome: "Vue da conta B", categoria: "Tecnologia", nivel: "Iniciante", descricao: "Descrição B", disponibilidade: "Colaborações" },
    ]));
    render(<MinhasPublicacoes usuarioId="conta-a" />);
    await user.click(screen.getByRole("button", { name: "Editar" }));
    const nome = screen.getByRole("textbox", { name: "Nome" });
    await user.clear(nome);
    await user.type(nome, "React atualizado");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(JSON.parse(localStorage.getItem("marketfaesa-habilidades:conta-b"))[0].nome).toBe("Vue da conta B");
    expect(JSON.parse(localStorage.getItem("marketfaesa-habilidades:conta-a"))[0].nome).toBe("React atualizado");
  });

  it("não salva nome ou descrição compostos apenas por espaços", async () => {
    const user = userEvent.setup();
    render(<MinhasPublicacoes usuarioId="conta-a" />);
    await user.click(screen.getByRole("button", { name: "Editar" }));
    await user.clear(screen.getByRole("textbox", { name: "Nome" }));
    await user.type(screen.getByRole("textbox", { name: "Nome" }), "   ");
    await user.clear(screen.getByRole("textbox", { name: "Descrição" }));
    await user.type(screen.getByRole("textbox", { name: "Descrição" }), "   ");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Preencha o nome e a descrição");
    expect(JSON.parse(localStorage.getItem("marketfaesa-habilidades:conta-a"))[0].nome).toBe("React");
  });
});

