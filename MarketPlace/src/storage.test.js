import { afterEach, describe, expect, it, vi } from "vitest";
import { lerValorSeguro, salvarValorSeguro, removerValorSeguro } from "./storage.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("operações seguras de armazenamento", () => {
  it("retorna o fallback quando a leitura falha", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("armazenamento indisponível");
    });

    expect(lerValorSeguro("chave", "padrão")).toBe("padrão");
  });

  it("informa falha sem lançar exceção ao salvar ou remover", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota excedida");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("armazenamento indisponível");
    });

    expect(salvarValorSeguro("chave", "valor")).toBe(false);
    expect(removerValorSeguro("chave")).toBe(false);
  });

  it("persiste e lê valores quando o armazenamento funciona", () => {
    expect(salvarValorSeguro("chave-segura", "valor")).toBe(true);
    expect(lerValorSeguro("chave-segura")).toBe("valor");
    expect(removerValorSeguro("chave-segura")).toBe(true);
    expect(lerValorSeguro("chave-segura")).toBeNull();
  });
});
