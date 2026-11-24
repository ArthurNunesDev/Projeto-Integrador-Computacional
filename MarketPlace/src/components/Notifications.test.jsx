import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Notificacoes, { LIMITE_PAGINA } from "./Notifications.jsx";
import { chamadas, erroApi, mockarApi, notificacao } from "../test/apiFalsa.js";

afterEach(() => {
  cleanup();
});

// Página com ids decrescentes a partir de `primeiro`.
function pagina(primeiro, tamanho, extras = {}) {
  return Array.from({ length: tamanho }, (_, i) => notificacao(primeiro - i, "CONEXAO_ACEITA", { texto: `Aviso ${primeiro - i}`, ...extras }));
}

function buscas(fetchFalso) {
  return fetchFalso.mock.calls
    .filter(([url, opcoes = {}]) => (opcoes.method || "GET") === "GET" && new URL(url).pathname === "/api/notificacoes")
    .map(([url]) => new URL(url).search);
}

function renderizar() {
  const onNavigate = vi.fn();
  const onAtualizar = vi.fn();
  render(<Notificacoes onNavigate={onNavigate} onAtualizar={onAtualizar} />);
  return { onNavigate, onAtualizar, user: userEvent.setup() };
}

describe("página de notificações", () => {
  it("carrega a primeira página e as seguintes com antesDeId até vir uma página incompleta", async () => {
    const fetchFalso = mockarApi({
      "GET /api/notificacoes": (_, url) => (url.searchParams.get("antesDeId") === "81" ? pagina(80, 5) : pagina(100, LIMITE_PAGINA)),
    });
    const { user } = renderizar();

    expect(screen.getByRole("status")).toHaveTextContent("Carregando notificações...");
    expect(await screen.findByText("Aviso 100")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(20);

    await user.click(screen.getByRole("button", { name: "Carregar mais" }));

    expect(await screen.findByText("Aviso 76")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(25);
    expect(screen.queryByRole("button", { name: "Carregar mais" })).not.toBeInTheDocument();
    expect(buscas(fetchFalso)).toEqual(["?limite=20", "?limite=20&antesDeId=81"]);
  });

  it("mostra o erro de carregar mais sem perder o que já foi carregado", async () => {
    mockarApi({
      "GET /api/notificacoes": (_, url) => (url.searchParams.has("antesDeId") ? erroApi(500, "Erro interno") : pagina(100, LIMITE_PAGINA)),
    });
    const { user } = renderizar();
    await screen.findByText("Aviso 100");

    await user.click(screen.getByRole("button", { name: "Carregar mais" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar mais. Erro interno");
    expect(screen.getAllByRole("listitem")).toHaveLength(20);
    expect(screen.getByRole("button", { name: "Carregar mais" })).toBeEnabled();
  });

  it("filtra só as não lidas pela API", async () => {
    const fetchFalso = mockarApi({
      "GET /api/notificacoes": (_, url) => (url.searchParams.get("naoLidas") === "true" ? [] : pagina(3, 3, { lida: true })),
    });
    const { user } = renderizar();
    await screen.findByText("Aviso 3");

    await user.click(screen.getByRole("checkbox", { name: "Só não lidas" }));

    expect(await screen.findByRole("heading", { name: "Nenhuma notificação não lida" })).toBeInTheDocument();
    expect(buscas(fetchFalso)).toEqual(["?limite=20", "?limite=20&naoLidas=true"]);
  });

  it("mostra o estado vazio", async () => {
    mockarApi({ "GET /api/notificacoes": [] });
    renderizar();

    expect(await screen.findByRole("heading", { name: "Nenhuma notificação por enquanto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar todas como lidas" })).toBeDisabled();
  });

  it("mostra o erro e tenta de novo", async () => {
    let falhar = true;
    mockarApi({ "GET /api/notificacoes": () => (falhar ? erroApi(503, "Fora do ar") : pagina(2, 2)) });
    const { user } = renderizar();

    expect(await screen.findByRole("alert")).toHaveTextContent("Fora do ar");
    falhar = false;
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Aviso 2")).toBeInTheDocument();
  });

  it("marca a notificação como lida e navega ao clicar", async () => {
    const fetchFalso = mockarApi({
      "GET /api/notificacoes": [notificacao(9, "PARTICIPACAO_NOVA", { texto: "Carla pediu para participar" })],
      "PUT /api/notificacoes/9/lida": null,
    });
    const { onNavigate, onAtualizar, user } = renderizar();

    await user.click(await screen.findByRole("button", { name: /Não lida: Carla pediu para participar/ }));

    expect(onNavigate).toHaveBeenCalledWith("oportunidades");
    expect(chamadas(fetchFalso, "PUT /api/notificacoes/9/lida")).toHaveLength(1);
    await waitFor(() => expect(onAtualizar).toHaveBeenCalled());
  });

  it("marca todas como lidas até a mais nova carregada", async () => {
    const fetchFalso = mockarApi({ "GET /api/notificacoes": pagina(30, 3), "PUT /api/notificacoes/lidas": null });
    const { onAtualizar, user } = renderizar();
    await screen.findByText("Aviso 30");

    await user.click(screen.getByRole("button", { name: "Marcar todas como lidas" }));

    expect(chamadas(fetchFalso, "PUT /api/notificacoes/lidas")).toEqual([{ ateId: 30 }]);
    expect(onAtualizar).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Não lida:/ })).not.toBeInTheDocument();
  });
});
