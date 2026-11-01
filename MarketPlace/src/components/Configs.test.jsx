import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as storage from "../storage.js";
import Configs from "./Configs.jsx";
import { chamadas, CURSO, erroApi, mockarApi, USUARIO } from "../test/apiFalsa.js";

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
  usuario: USUARIO,
  onUpdateUsuario: vi.fn(async () => ({ sucesso: true })),
  onContaExcluida: vi.fn(),
  onLogout: vi.fn(),
  onNavigate: vi.fn(),
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mockarApi({ "GET /api/cursos": [CURSO, { id: 6, nome: "Direito" }] });
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
    const onUpdateUsuario = vi.fn(async () => ({ sucesso: true }));
    render(<Configs {...props} onUpdateUsuario={onUpdateUsuario} />);

    await user.clear(screen.getByLabelText("Nome completo"));
    await user.click(screen.getByRole("button", { name: "Salvar dados da conta" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Informe seu nome completo");
    expect(onUpdateUsuario).not.toHaveBeenCalled();
  });

  it("salva curso e período como números pelo PUT do perfil", async () => {
    const user = userEvent.setup();
    const onUpdateUsuario = vi.fn(async () => ({ sucesso: true }));
    render(<Configs {...props} onUpdateUsuario={onUpdateUsuario} />);

    await user.selectOptions(await screen.findByLabelText("Curso"), "Direito");
    await user.selectOptions(screen.getByLabelText("Período"), "7º período");
    await user.click(screen.getByRole("button", { name: "Salvar dados da conta" }));

    expect(onUpdateUsuario).toHaveBeenCalledWith({ nome: "Ana Souza", cursoId: 6, periodo: 7 });
    expect(await screen.findByRole("status")).toHaveTextContent("Alterações salvas");
  });

  it("não confirma dados da conta quando o salvamento falha", async () => {
    const user = userEvent.setup();
    render(<Configs {...props} onUpdateUsuario={vi.fn(async () => ({ sucesso: false, mensagem: "Dados inválidos" }))} />);

    await user.click(screen.getByRole("button", { name: "Salvar dados da conta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Dados inválidos");
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
  });

  it("troca a senha com PUT /api/usuarios/me/senha e mostra senha atual incorreta", async () => {
    const fetchFalso = mockarApi({
      "PUT /api/usuarios/me/senha": (corpo) =>
        corpo.senhaAtual === "certa1234" ? null : erroApi(400, "Dados inválidos", { senhaAtual: "senha incorreta" }),
    });
    const user = userEvent.setup();
    render(<Configs {...props} />);
    await user.click(screen.getByRole("button", { name: /Segurança/ }));

    await user.type(screen.getByLabelText("Senha atual"), "errada123");
    await user.type(screen.getByLabelText("Nova senha"), "novasenha1");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "outra-coisa");
    await user.click(screen.getByRole("button", { name: "Alterar senha" }));
    expect(screen.getByRole("alert")).toHaveTextContent("A confirmação não confere");

    await user.clear(screen.getByLabelText("Confirmar nova senha"));
    await user.type(screen.getByLabelText("Confirmar nova senha"), "novasenha1");
    await user.click(screen.getByRole("button", { name: "Alterar senha" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Senha atual: senha incorreta.");

    await user.clear(screen.getByLabelText("Senha atual"));
    await user.type(screen.getByLabelText("Senha atual"), "certa1234");
    await user.click(screen.getByRole("button", { name: "Alterar senha" }));
    expect(await screen.findByText("✓ Senha alterada.")).toBeInTheDocument();
    expect(chamadas(fetchFalso, "PUT /api/usuarios/me/senha").at(-1)).toEqual({ senhaAtual: "certa1234", novaSenha: "novasenha1" });
  });

  it("exclui a conta com DELETE confirmando a senha", async () => {
    const fetchFalso = mockarApi({
      "GET /api/cursos": [],
      "DELETE /api/usuarios/me": (corpo) =>
        corpo.senha === "certa1234" ? null : erroApi(400, "Dados inválidos", { senha: "senha incorreta" }),
    });
    const onContaExcluida = vi.fn();
    const user = userEvent.setup();
    render(<Configs {...props} onContaExcluida={onContaExcluida} />);

    await user.type(screen.getByLabelText("Confirme sua senha"), "errada123");
    await user.click(screen.getByRole("button", { name: "Excluir conta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Senha: senha incorreta.");
    expect(onContaExcluida).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Confirme sua senha"));
    await user.type(screen.getByLabelText("Confirme sua senha"), "certa1234");
    await user.click(screen.getByRole("button", { name: "Excluir conta" }));
    await vi.waitFor(() => expect(onContaExcluida).toHaveBeenCalled());
    expect(chamadas(fetchFalso, "DELETE /api/usuarios/me").at(-1)).toEqual({ senha: "certa1234" });
  });
});
