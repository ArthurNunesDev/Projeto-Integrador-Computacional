import { describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Header from "./Header.jsx";

describe("ações do cabeçalho", () => {
  it("não oferece notificações e mantém o menu do perfil", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Header paginaAtual="inicio" onNavigate={onNavigate} onSearch={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Notificações" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Menu do perfil" }));
    await user.click(screen.getByRole("button", { name: /Configurações/ }));

    expect(onNavigate).toHaveBeenCalledWith("configuracoes");
    cleanup();
  });
});
