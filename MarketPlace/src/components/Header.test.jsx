import { describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Header from "./Header.jsx";

describe("notificações do cabeçalho", () => {
  it("abre e fecha o painel demonstrativo sem exibir notificações fictícias", async () => {
    const user = userEvent.setup();
    render(<Header paginaAtual="inicio" onNavigate={vi.fn()} onSearch={vi.fn()} />);

    const botao = screen.getByRole("button", { name: "Notificações" });
    expect(botao).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region", { name: "Painel de notificações" })).not.toBeInTheDocument();

    await user.click(botao);

    expect(botao).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Nenhuma notificação")).toBeInTheDocument();
    expect(screen.getByText("Quando houver novidades, elas aparecerão aqui.")).toBeInTheDocument();

    await user.click(botao);

    expect(botao).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region", { name: "Painel de notificações" })).not.toBeInTheDocument();
    cleanup();
  });
});
