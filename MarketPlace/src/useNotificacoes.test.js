import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

import { useNotificacoes } from "./useNotificacoes.js";
import { chamadas, erroApi, mockarApi } from "./test/apiFalsa.js";
import { definirAbaOculta, restaurarVisibilidade } from "./test/visibilidade.js";

const ROTA = "GET /api/notificacoes/contagem";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  restaurarVisibilidade();
});

async function avancar(ms) {
  await act(() => vi.advanceTimersByTimeAsync(ms));
}

describe("useNotificacoes", () => {
  it("consulta a contagem ao entrar e a cada 30 s", async () => {
    vi.useFakeTimers();
    const fetchFalso = mockarApi({ [ROTA]: { naoLidas: 4, mensagensNaoLidas: 2 } });
    const { result } = renderHook(() => useNotificacoes(1));
    await avancar(0);

    expect(result.current).toMatchObject({ naoLidas: 4, mensagensNaoLidas: 2 });
    expect(chamadas(fetchFalso, ROTA)).toHaveLength(1);

    await avancar(29_999);
    expect(chamadas(fetchFalso, ROTA)).toHaveLength(1);
    await avancar(1);
    expect(chamadas(fetchFalso, ROTA)).toHaveLength(2);
    await avancar(30_000);
    expect(chamadas(fetchFalso, ROTA)).toHaveLength(3);
  });

  it("não consulta sem usuário", async () => {
    vi.useFakeTimers();
    const fetchFalso = mockarApi({ [ROTA]: { naoLidas: 4, mensagensNaoLidas: 0 } });
    const { result } = renderHook(() => useNotificacoes(null));
    await avancar(60_000);

    expect(fetchFalso).not.toHaveBeenCalled();
    expect(result.current.naoLidas).toBe(0);
  });

  it("pausa com a aba oculta e consulta na hora ao voltar", async () => {
    vi.useFakeTimers();
    const fetchFalso = mockarApi({ [ROTA]: { naoLidas: 1, mensagensNaoLidas: 0 } });
    renderHook(() => useNotificacoes(1));
    await avancar(0);

    act(() => definirAbaOculta(true));
    await avancar(120_000);
    expect(chamadas(fetchFalso, ROTA)).toHaveLength(1);

    act(() => definirAbaOculta(false));
    await avancar(0);
    expect(chamadas(fetchFalso, ROTA)).toHaveLength(2);
    await avancar(30_000);
    expect(chamadas(fetchFalso, ROTA)).toHaveLength(3);
  });

  it("pausa depois de 10 min sem interação e retoma ao interagir", async () => {
    vi.useFakeTimers();
    const fetchFalso = mockarApi({ [ROTA]: { naoLidas: 0, mensagensNaoLidas: 0 } });
    renderHook(() => useNotificacoes(1));
    await avancar(0);

    await avancar(30 * 60_000);
    // Consultas em 0, 30 s, ..., 9 min 30 s; em 10 min já está inativo.
    expect(chamadas(fetchFalso, ROTA)).toHaveLength(20);

    act(() => window.dispatchEvent(new Event("pointerdown")));
    await avancar(0);
    expect(chamadas(fetchFalso, ROTA)).toHaveLength(21);
  });

  it("espera 60, 120, 240 e no máximo 300 s depois de falhas de rede e volta a 30 s ao conseguir", async () => {
    vi.useFakeTimers();
    let falhar = true;
    const fetchFalso = mockarApi({});
    fetchFalso.mockImplementation(async () => {
      if (falhar) throw new TypeError("Failed to fetch");
      return new Response(JSON.stringify({ naoLidas: 2, mensagensNaoLidas: 0 }), { status: 200 });
    });
    const total = () => fetchFalso.mock.calls.length;
    const { result } = renderHook(() => useNotificacoes(1));
    await avancar(0);
    expect(total()).toBe(1);

    for (const espera of [60_000, 120_000, 240_000, 300_000, 300_000]) {
      // Interage a cada passo para não cair na pausa por inatividade.
      act(() => window.dispatchEvent(new Event("keydown")));
      const antes = total();
      await avancar(espera - 1);
      expect(total()).toBe(antes);
      await avancar(1);
      expect(total()).toBe(antes + 1);
    }

    falhar = false;
    act(() => window.dispatchEvent(new Event("keydown")));
    await avancar(300_000);
    expect(result.current.naoLidas).toBe(2);
    const antes = total();
    await avancar(30_000);
    expect(total()).toBe(antes + 1);
  });

  it("para de consultar depois de um 401", async () => {
    vi.useFakeTimers();
    const fetchFalso = mockarApi({ [ROTA]: erroApi(401, "Não autenticado") });
    renderHook(() => useNotificacoes(1));
    await avancar(10 * 60_000);

    expect(chamadas(fetchFalso, ROTA)).toHaveLength(1);
  });

  it("não sobrepõe consultas quando recarregar é chamado durante uma em curso", async () => {
    vi.useFakeTimers();
    let responder;
    const fetchFalso = mockarApi({});
    fetchFalso.mockImplementation(() => new Promise((resolver) => {
      responder = () => resolver(new Response(JSON.stringify({ naoLidas: 1, mensagensNaoLidas: 0 }), { status: 200 }));
    }));
    const { result } = renderHook(() => useNotificacoes(1));

    act(() => {
      result.current.recarregar();
      result.current.recarregar();
    });
    await avancar(60_000);
    expect(fetchFalso).toHaveBeenCalledTimes(1);

    await act(async () => responder());
    await avancar(0);
    expect(fetchFalso).toHaveBeenCalledTimes(2);
  });

  it("aborta a consulta em curso ao desmontar", async () => {
    const fetchFalso = mockarApi({});
    fetchFalso.mockImplementation(() => new Promise(() => {}));
    const { unmount } = renderHook(() => useNotificacoes(1));

    unmount();
    expect(fetchFalso.mock.calls[0][1].signal.aborted).toBe(true);
  });
});
