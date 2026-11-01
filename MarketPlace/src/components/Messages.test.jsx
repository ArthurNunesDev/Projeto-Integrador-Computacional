import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Mensagens from "./Messages.jsx";
import { chamadas, erroApi, mockarApi, pessoaResumo } from "../test/apiFalsa.js";

function mensagem(id, texto, minha) {
  return { id, autorId: minha ? 1 : 2, minha, texto, lida: true, criadoEm: "2026-10-30T09:15:00Z" };
}

const CONVERSAS = [
  { id: 10, pessoa: pessoaResumo(2, "Bruno Lima"), ultimaMensagem: mensagem(2, "Topa revisar?", false), naoLidas: 1, atualizadoEm: "" },
  { id: 11, pessoa: pessoaResumo(3, "Carla Dias"), ultimaMensagem: null, naoLidas: 0, atualizadoEm: "" },
];

function rotas(extras = {}) {
  return {
    "GET /api/conversas": CONVERSAS,
    "GET /api/conversas/10/mensagens": [mensagem(1, "Oi, Bruno!", true), mensagem(2, "Topa revisar?", false)],
    "GET /api/conversas/11/mensagens": [],
    ...extras,
  };
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Mensagens", () => {
  it("lista as conversas e abre a primeira com as mensagens da API", async () => {
    mockarApi(rotas());
    render(<Mensagens />);

    expect(await screen.findByText("Oi, Bruno!")).toBeInTheDocument();
    expect(screen.getByText("Oi, Bruno!").closest(".mensagem-linha")).toHaveClass("enviada");
    expect(screen.getByText("Topa revisar?", { selector: ".mensagem-balao span" }).closest(".mensagem-linha")).toHaveClass("recebida");
    expect(screen.getByRole("button", { name: /Carla Dias/ })).toHaveTextContent("Nova conversa");
  });

  it("envia com POST e mostra a mensagem na conversa", async () => {
    const fetchFalso = mockarApi(rotas({
      "POST /api/conversas/10/mensagens": (corpo) => mensagem(3, corpo.texto, true),
    }));
    const user = userEvent.setup();
    render(<Mensagens />);
    await screen.findByText("Oi, Bruno!");

    await user.type(screen.getByPlaceholderText("Digite uma mensagem..."), "Topo sim!");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByText("Topo sim!", { selector: ".mensagem-balao span" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Digite uma mensagem...")).toHaveValue("");
    expect(chamadas(fetchFalso, "POST /api/conversas/10/mensagens")).toEqual([{ texto: "Topo sim!" }]);
  });

  it("mantém o texto e mostra o erro quando o envio falha", async () => {
    mockarApi(rotas({ "POST /api/conversas/10/mensagens": erroApi(403, "Esta pessoa não aceita mensagens") }));
    const user = userEvent.setup();
    render(<Mensagens />);
    await screen.findByText("Oi, Bruno!");

    await user.type(screen.getByPlaceholderText("Digite uma mensagem..."), "Olá");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Esta pessoa não aceita mensagens");
    expect(screen.getByPlaceholderText("Digite uma mensagem...")).toHaveValue("Olá");
  });

  it("abre direto na conversa recebida da tela anterior", async () => {
    const fetchFalso = mockarApi(rotas());
    render(<Mensagens conversaInicial={11} />);

    expect(await screen.findByText("NENHUMA MENSAGEM AINDA")).toBeInTheDocument();
    expect(chamadas(fetchFalso, "GET /api/conversas/10/mensagens")).toHaveLength(0);
  });

  it("recarrega as mensagens a cada 5 segundos e para ao sair da tela", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchFalso = mockarApi(rotas());
    const { unmount } = render(<Mensagens />);
    await screen.findByText("Oi, Bruno!");
    expect(chamadas(fetchFalso, "GET /api/conversas/10/mensagens")).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(5000);
    expect(chamadas(fetchFalso, "GET /api/conversas/10/mensagens")).toHaveLength(2);

    unmount();
    await vi.advanceTimersByTimeAsync(10000);
    expect(chamadas(fetchFalso, "GET /api/conversas/10/mensagens")).toHaveLength(2);
  });

  it("explica como começar quando não há conversas", async () => {
    mockarApi({ "GET /api/conversas": [] });
    render(<Mensagens />);

    expect(await screen.findByRole("heading", { name: "Nenhuma conversa" })).toBeInTheDocument();
  });
});
