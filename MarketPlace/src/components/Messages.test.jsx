import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Mensagens from "./Messages.jsx";
import { chaveUsuario } from "../storage.js";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Mensagens", () => {
  it("salva a mensagem antes de atualizar a conversa", async () => {
    const user = userEvent.setup();
    const chave = chaveUsuario("marketfaesa-mensagens", "conta-a");
    render(<Mensagens usuarioId="conta-a" />);

    const campo = screen.getByPlaceholderText("Digite uma mensagem...");
    await user.type(campo, "Mensagem de teste");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(screen.getAllByText("Mensagem de teste")).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem(chave))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ana-souza",
          mensagens: expect.arrayContaining([
            expect.objectContaining({ autor: "eu", texto: "Mensagem de teste" }),
          ]),
        }),
      ]),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("mantém o texto e não exibe a mensagem se o armazenamento falhar", async () => {
    const user = userEvent.setup();
    const chave = chaveUsuario("marketfaesa-mensagens", "conta-a");
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (key, value) {
      if (key === chave) throw new Error("Quota exceeded");
      return originalSetItem.call(this, key, value);
    });

    render(<Mensagens usuarioId="conta-a" />);
    const campo = screen.getByPlaceholderText("Digite uma mensagem...");
    await user.type(campo, "Não pode sumir");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível salvar as mensagens");
    expect(campo).toHaveValue("Não pode sumir");
    expect(screen.queryByText("Não pode sumir")).not.toBeInTheDocument();
  });

  it("mantém as mensagens isoladas ao trocar de conta", async () => {
    const user = userEvent.setup();
    const chaveA = chaveUsuario("marketfaesa-mensagens", "conta-a");
    const chaveB = chaveUsuario("marketfaesa-mensagens", "conta-b");
    const { rerender } = render(<Mensagens usuarioId="conta-a" />);

    await user.type(screen.getByPlaceholderText("Digite uma mensagem..."), "Privada da conta A");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    expect(JSON.parse(localStorage.getItem(chaveA))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          mensagens: expect.arrayContaining([
            expect.objectContaining({ texto: "Privada da conta A" }),
          ]),
        }),
      ]),
    );

    rerender(<Mensagens usuarioId="conta-b" />);
    expect(screen.queryByText("Privada da conta A")).not.toBeInTheDocument();
    expect(localStorage.getItem(chaveB)).toBeNull();
    expect(JSON.parse(localStorage.getItem(chaveA))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          mensagens: expect.arrayContaining([
            expect.objectContaining({ texto: "Privada da conta A" }),
          ]),
        }),
      ]),
    );
  });

  it("ignora conversas e mensagens inválidas do armazenamento", () => {
    const chave = chaveUsuario("marketfaesa-mensagens", "conta-a");
    localStorage.setItem(chave, JSON.stringify([
      null,
      { id: "incompleta" },
      {
        id: "ana-souza",
        nome: "Ana Souza",
        curso: "Ciência da Computação",
        iniciais: "AS",
        online: true,
        naoLidas: 2,
        mensagens: [
          null,
          { id: "mensagem-invalida", autor: "desconhecido", texto: 10, hora: "09:00" },
          { id: "mensagem-valida", autor: "outra", texto: "Mensagem preservada", hora: "09:30" },
        ],
      },
    ]));

    render(<Mensagens usuarioId="conta-a" />);

    expect(screen.getAllByText("Mensagem preservada")).toHaveLength(2);
    expect(screen.queryByText("Oi! Vi seu perfil na MarketFAESA e gostei da sua experiência com desenvolvimento web.")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("persiste a remoção do contador de não lidas ao abrir conversa", async () => {
    const user = userEvent.setup();
    const chave = chaveUsuario("marketfaesa-mensagens", "conta-a");
    render(<Mensagens usuarioId="conta-a" />);

    await user.click(screen.getByRole("button", { name: /Lucas Martins/ }));

    const conversas = JSON.parse(localStorage.getItem(chave));
    expect(conversas.find((conversa) => conversa.id === "lucas-martins").naoLidas).toBe(0);
  });
});
