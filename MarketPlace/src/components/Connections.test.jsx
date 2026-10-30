import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Connections from "./Connections.jsx";
import { chamadas, erroApi, mockarApi, pessoa, pessoaResumo } from "../test/apiFalsa.js";

const BRUNO = pessoa(2, "Bruno Lima", [{ id: 20, nome: "Figma", categoria: "Design", nivel: "AVANCADO", disponibilidade: "COLABORACOES" }]);
const CARLA = pessoa(3, "Carla Dias");

function conexao(id, pessoaResposta, status, enviadaPorMim) {
  return { id, status, enviadaPorMim, pessoa: pessoaResumo(pessoaResposta.id, pessoaResposta.nome), criadoEm: "", atualizadoEm: "" };
}

function rotas(extras = {}) {
  return {
    "GET /api/pessoas": [BRUNO, CARLA],
    "GET /api/conexoes": [],
    "GET /api/conexoes/recebidas": [],
    "GET /api/conexoes/enviadas": [],
    ...extras,
  };
}

afterEach(() => {
  cleanup();
});

async function abrirEncontrar(user) {
  await user.click(within(screen.getByRole("navigation", { name: "Seções de conexões" })).getByRole("button", { name: /Encontrar pessoas/ }));
}

describe("Conexões", () => {
  it("mostra as conexões aceitas completando os dados pelo diretório", async () => {
    mockarApi(rotas({ "GET /api/conexoes": [conexao(7, BRUNO, "ACEITA", true)] }));
    render(<Connections />);

    expect(await screen.findByRole("heading", { name: "Bruno Lima" })).toBeInTheDocument();
    expect(await screen.findByText("Figma")).toBeInTheDocument();
    expect(screen.getByText("⌖ Serra")).toBeInTheDocument();
  });

  it("envia o pedido com POST e mostra como pendente sem abrir o perfil", async () => {
    const fetchFalso = mockarApi(rotas({
      "POST /api/conexoes": conexao(8, CARLA, "PENDENTE", true),
    }));
    const user = userEvent.setup();
    render(<Connections />);
    await abrirEncontrar(user);
    await screen.findByRole("heading", { name: "Carla Dias" });

    const cartao = screen.getByRole("heading", { name: "Carla Dias" }).closest("article");
    within(cartao).getByRole("button", { name: "+ Conectar" }).focus();
    await user.keyboard("{Enter}");

    expect(await within(cartao).findByRole("button", { name: "Pedido enviado" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: "Carla Dias" })).not.toBeInTheDocument();
    expect(chamadas(fetchFalso, "POST /api/conexoes")).toEqual([{ destinatarioId: 3 }]);
  });

  it("aceita e recusa solicitações recebidas", async () => {
    const fetchFalso = mockarApi(rotas({
      "GET /api/conexoes/recebidas": [conexao(7, BRUNO, "PENDENTE", false), conexao(9, CARLA, "PENDENTE", false)],
      "POST /api/conexoes/7/aceitar": conexao(7, BRUNO, "ACEITA", false),
      "POST /api/conexoes/9/recusar": null,
    }));
    const user = userEvent.setup();
    render(<Connections />);

    await user.click(await screen.findByRole("button", { name: /Solicitações/ }));
    const pedidoBruno = (await screen.findByRole("heading", { name: "Bruno Lima" })).closest("article");
    await user.click(within(pedidoBruno).getByRole("button", { name: "Aceitar" }));
    const pedidoCarla = (await screen.findByRole("heading", { name: "Carla Dias" })).closest("article");
    await user.click(within(pedidoCarla).getByRole("button", { name: "Recusar" }));

    expect(await screen.findByText("Nenhuma solicitação pendente")).toBeInTheDocument();
    expect(chamadas(fetchFalso, "POST /api/conexoes/7/aceitar")).toHaveLength(1);
    expect(chamadas(fetchFalso, "POST /api/conexoes/9/recusar")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Minhas conexões/ })).toHaveTextContent("1");
  });

  it("abre o perfil pelo teclado e inicia uma conversa", async () => {
    const onAbrirConversa = vi.fn();
    mockarApi(rotas({ "POST /api/conversas": { id: 50, pessoa: pessoaResumo(2, "Bruno Lima"), ultimaMensagem: null, naoLidas: 0 } }));
    const user = userEvent.setup();
    render(<Connections onAbrirConversa={onAbrirConversa} />);
    await abrirEncontrar(user);

    const cartao = await screen.findByRole("button", { name: /Bruno Lima/ });
    cartao.focus();
    await user.keyboard(" ");
    expect(screen.getByRole("heading", { level: 1, name: "Bruno Lima" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mensagem" }));
    await vi.waitFor(() => expect(onAbrirConversa).toHaveBeenCalledWith(50));
  });

  it("mostra o erro quando a pessoa não aceita mensagens", async () => {
    mockarApi(rotas({ "POST /api/conversas": erroApi(403, "Esta pessoa não aceita mensagens") }));
    const user = userEvent.setup();
    render(<Connections onAbrirConversa={vi.fn()} />);
    await abrirEncontrar(user);

    await user.click(await screen.findByRole("button", { name: /Carla Dias/ }));
    await user.click(screen.getByRole("button", { name: "Mensagem" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Esta pessoa não aceita mensagens");
  });
});
