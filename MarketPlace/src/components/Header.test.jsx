import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Header from "./Header.jsx";
import { chamadas, erroApi, mockarApi, notificacao } from "../test/apiFalsa.js";

afterEach(() => {
  cleanup();
});

function renderizar(props = {}) {
  const onNavigate = vi.fn();
  const onAtualizarNotificacoes = vi.fn();
  render(
    <Header
      paginaAtual="inicio"
      onNavigate={onNavigate}
      onSearch={vi.fn()}
      onAtualizarNotificacoes={onAtualizarNotificacoes}
      {...props}
    />,
  );
  return { onNavigate, onAtualizarNotificacoes, user: userEvent.setup() };
}

const ULTIMAS = [
  notificacao(42, "CONEXAO_SOLICITADA", { texto: "Bruno Lima quer se conectar com você" }),
  notificacao(41, "PARTICIPACAO_ACEITA", { texto: "Sua participação em App para Clínica foi aceita" }),
  notificacao(40, "OPORTUNIDADE_FECHADA", { texto: "Revisão de Contratos foi encerrada", lida: true }),
];

describe("ações do cabeçalho", () => {
  it("mantém o menu do perfil", async () => {
    const { onNavigate, user } = renderizar();

    await user.click(screen.getByRole("button", { name: "Menu do perfil" }));
    await user.click(screen.getByRole("button", { name: /Configurações/ }));

    expect(onNavigate).toHaveBeenCalledWith("configuracoes");
  });

  it("mostra mensagens não lidas no item Mensagens do menu", () => {
    renderizar({ mensagensNaoLidas: 3 });

    expect(screen.getByRole("button", { name: /Mensagens, 3 não lidas$/, hidden: true })).toHaveTextContent("3");
  });

  it("não mostra badge de mensagens sem não lidas", () => {
    renderizar({ mensagensNaoLidas: 0 });

    expect(screen.getByRole("button", { name: /Mensagens$/, hidden: true })).not.toHaveTextContent(/\d/);
  });
});

describe("sino de notificações", () => {
  it("anuncia as não lidas e limita o badge a 99+", () => {
    renderizar({ naoLidas: 150 });

    const sino = screen.getByRole("button", { name: "Notificações, 150 não lidas" });
    expect(sino).toHaveTextContent("99+");
    expect(sino).toHaveAttribute("aria-expanded", "false");
  });

  it("não mostra badge sem não lidas", () => {
    renderizar({ naoLidas: 0 });

    expect(screen.getByRole("button", { name: "Notificações, nenhuma não lida" })).not.toHaveTextContent(/\d/);
  });

  it("abre com as 10 últimas da API", async () => {
    const fetchFalso = mockarApi({ "GET /api/notificacoes": ULTIMAS });
    const { user } = renderizar({ naoLidas: 2 });

    await user.click(screen.getByRole("button", { name: /^Notificações/ }));

    const painel = screen.getByRole("region", { name: "Notificações" });
    expect(await within(painel).findByText("Bruno Lima quer se conectar com você")).toBeInTheDocument();
    expect(within(painel).getAllByRole("listitem")).toHaveLength(3);
    expect(within(painel).getByRole("button", { name: /Não lida: Bruno Lima/ })).toBeInTheDocument();
    expect(within(painel).getByRole("button", { name: /^Revisão de Contratos/ })).toBeInTheDocument();
    expect(new URL(fetchFalso.mock.calls[0][0]).search).toBe("?limite=10");
    expect(screen.getByRole("button", { name: /^Notificações/ })).toHaveAttribute("aria-expanded", "true");
  });

  it("marca como lida e navega para conexões ao clicar numa notificação de conexão", async () => {
    const fetchFalso = mockarApi({ "GET /api/notificacoes": ULTIMAS, "PUT /api/notificacoes/42/lida": null });
    const { onNavigate, onAtualizarNotificacoes, user } = renderizar({ naoLidas: 2 });
    await user.click(screen.getByRole("button", { name: /^Notificações/ }));

    await user.click(await screen.findByRole("button", { name: /Bruno Lima quer se conectar/ }));

    expect(onNavigate).toHaveBeenCalledWith("conexoes");
    expect(chamadas(fetchFalso, "PUT /api/notificacoes/42/lida")).toHaveLength(1);
    await waitFor(() => expect(onAtualizarNotificacoes).toHaveBeenCalled());
    expect(screen.queryByRole("region", { name: "Notificações" })).not.toBeInTheDocument();
  });

  it("leva participações e oportunidades para a tela de oportunidades sem remarcar as já lidas", async () => {
    const fetchFalso = mockarApi({ "GET /api/notificacoes": ULTIMAS, "PUT /api/notificacoes/41/lida": null });
    const { onNavigate, user } = renderizar({ naoLidas: 2 });

    await user.click(screen.getByRole("button", { name: /^Notificações/ }));
    await user.click(await screen.findByRole("button", { name: /participação em App para Clínica/ }));
    expect(onNavigate).toHaveBeenLastCalledWith("oportunidades");

    await user.click(screen.getByRole("button", { name: /^Notificações/ }));
    await user.click(await screen.findByRole("button", { name: /^Revisão de Contratos/ }));
    expect(onNavigate).toHaveBeenLastCalledWith("oportunidades");
    expect(chamadas(fetchFalso, "PUT /api/notificacoes/40/lida")).toHaveLength(0);
  });

  it("marca todas como lidas até a mais nova exibida", async () => {
    const fetchFalso = mockarApi({ "GET /api/notificacoes": ULTIMAS, "PUT /api/notificacoes/lidas": null });
    const { onAtualizarNotificacoes, user } = renderizar({ naoLidas: 2 });
    await user.click(screen.getByRole("button", { name: /^Notificações/ }));
    await screen.findByText("Bruno Lima quer se conectar com você");

    await user.click(screen.getByRole("button", { name: "Marcar todas como lidas" }));

    expect(chamadas(fetchFalso, "PUT /api/notificacoes/lidas")).toEqual([{ ateId: 42 }]);
    expect(onAtualizarNotificacoes).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Não lida:/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar todas como lidas" })).toBeDisabled();
  });

  it("mostra o erro de marcar todas e mantém as não lidas", async () => {
    mockarApi({ "GET /api/notificacoes": ULTIMAS, "PUT /api/notificacoes/lidas": erroApi(500, "Erro interno") });
    const { user } = renderizar({ naoLidas: 2 });
    await user.click(screen.getByRole("button", { name: /^Notificações/ }));
    await screen.findByText("Bruno Lima quer se conectar com você");

    await user.click(screen.getByRole("button", { name: "Marcar todas como lidas" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível marcar como lidas. Erro interno");
    expect(screen.getAllByRole("button", { name: /Não lida:/ })).toHaveLength(2);
  });

  it("mostra estado vazio e leva para a página com Ver todas", async () => {
    mockarApi({ "GET /api/notificacoes": [] });
    const { onNavigate, user } = renderizar();
    await user.click(screen.getByRole("button", { name: /^Notificações/ }));

    expect(await screen.findByText("Nenhuma notificação por enquanto.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar todas como lidas" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Ver todas" }));

    expect(onNavigate).toHaveBeenCalledWith("notificacoes");
  });

  it("mostra erro ao carregar e tenta de novo", async () => {
    let falhar = true;
    mockarApi({ "GET /api/notificacoes": () => (falhar ? erroApi(500, "Erro interno") : ULTIMAS) });
    const { user } = renderizar();
    await user.click(screen.getByRole("button", { name: /^Notificações/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar as notificações. Erro interno");

    falhar = false;
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Bruno Lima quer se conectar com você")).toBeInTheDocument();
  });

  it("fecha com Esc e devolve o foco ao sino", async () => {
    mockarApi({ "GET /api/notificacoes": [] });
    const { user } = renderizar();
    const sino = screen.getByRole("button", { name: /^Notificações/ });
    await user.click(sino);
    await screen.findByText("Nenhuma notificação por enquanto.");

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("region", { name: "Notificações" })).not.toBeInTheDocument();
    expect(sino).toHaveFocus();
  });
});
