import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as storage from "../storage.js";
import Configs from "./Configs.jsx";

const props = {
  tema: "light",
  onChangeTema: vi.fn(() => true),
  configuracoes: {
    perfilPublico: true, mostrarEmail: false, permitirMensagens: true,
    novasOportunidades: true, mensagens: true, conexoes: true,
    publicacoes: true, resumoSemanal: false, reduzirAnimacoes: false,
  },
  onAlterarConfiguracao: vi.fn(() => true),
  preferencias: { area: "tecnologia", modalidade: "todas", frequencia: "imediato" },
  onAlterarPreferencia: vi.fn(() => true),
  usuario: { id: "conta-a", nome: "Ana Souza", email: "ana@example.com", curso: "ADS", periodo: "3º período" },
  onUpdateUsuario: vi.fn(() => true),
  onLogout: vi.fn(),
  onNavigate: vi.fn(),
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Configurações", () => {
  it("não confirma alterações quando a persistência de privacidade falha", async () => {
    const user = userEvent.setup();
    const onAlterarConfiguracao = vi.fn(() => false);
    render(<Configs {...props} onAlterarConfiguracao={onAlterarConfiguracao} />);

    await user.click(screen.getByRole("button", { name: /Privacidade/ }));
    await user.click(screen.getByRole("switch", { name: "Perfil público" }));

    expect(onAlterarConfiguracao).toHaveBeenCalledWith("perfilPublico");
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível salvar as alterações");
    expect(screen.queryByRole("status", { name: /Alterações salvas/ })).not.toBeInTheDocument();
  });

  it("não confirma alteração de preferência quando a gravação falha", async () => {
    const user = userEvent.setup();
    const onAlterarPreferencia = vi.fn(() => false);
    render(<Configs {...props} onAlterarPreferencia={onAlterarPreferencia} />);

    await user.click(screen.getByRole("button", { name: /Preferências/ }));
    await user.selectOptions(screen.getByLabelText("Área principal de interesse"), "design");

    expect(onAlterarPreferencia).toHaveBeenCalledWith("area", "design");
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível salvar as alterações");
  });

  it("exige nome completo antes de salvar dados da conta", async () => {
    const user = userEvent.setup();
    const onUpdateUsuario = vi.fn(() => true);
    render(<Configs {...props} onUpdateUsuario={onUpdateUsuario} />);

    await user.clear(screen.getByLabelText("Nome completo"));
    await user.click(screen.getByRole("button", { name: "Salvar dados da conta" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Informe seu nome completo");
    expect(onUpdateUsuario).not.toHaveBeenCalled();
  });

  it("não confirma dados da conta quando o salvamento falha", async () => {
    const user = userEvent.setup();
    render(<Configs {...props} onUpdateUsuario={vi.fn(() => false)} />);

    await user.click(screen.getByRole("button", { name: "Salvar dados da conta" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível salvar as alterações");
    expect(screen.queryByRole("status", { name: /Alterações salvas/ })).not.toBeInTheDocument();
  });

  it("não altera visualmente a preferência de duas etapas se o armazenamento falhar", async () => {
    const user = userEvent.setup();
    vi.spyOn(storage, "salvarValorSeguro").mockReturnValue(false);
    render(<Configs {...props} />);

    await user.click(screen.getByRole("button", { name: /Segurança/ }));
    const toggle = screen.getByRole("switch", { name: /Verificação em duas etapas/ });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível salvar as alterações");
  });

  it("explica que a verificação em duas etapas ainda é demonstrativa", async () => {
    const user = userEvent.setup();
    render(<Configs {...props} />);

    await user.click(screen.getByRole("button", { name: /Segurança/ }));

    expect(screen.getByText(/Ainda não protege o login/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alterar senha" })).toBeDisabled();
  });
});
