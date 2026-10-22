import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
