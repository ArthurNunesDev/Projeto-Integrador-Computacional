import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

import { useIntervaloVisivel } from "./useIntervaloVisivel.js";
import { definirAbaOculta, restaurarVisibilidade } from "./test/visibilidade.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  restaurarVisibilidade();
});

describe("useIntervaloVisivel", () => {
  it("só agenda a próxima execução depois que a anterior termina", async () => {
    vi.useFakeTimers();
    let terminar;
    const tarefa = vi.fn(() => new Promise((resolver) => { terminar = resolver; }));
    const { result } = renderHook(() => useIntervaloVisivel(tarefa, 1000));
    expect(tarefa).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(5000));
    act(() => result.current());
    expect(tarefa).toHaveBeenCalledTimes(1);

    // O pedido feito durante a execução roda logo depois dela, e não em paralelo.
    await act(async () => terminar());
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(tarefa).toHaveBeenCalledTimes(2);
  });

  it("usa a espera devolvida pela tarefa e para quando ela devolve false", async () => {
    vi.useFakeTimers();
    const respostas = [3000, false];
    const tarefa = vi.fn(async () => respostas.shift());
    renderHook(() => useIntervaloVisivel(tarefa, 1000));
    await act(() => vi.advanceTimersByTimeAsync(0));

    await act(() => vi.advanceTimersByTimeAsync(2999));
    expect(tarefa).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(tarefa).toHaveBeenCalledTimes(2);

    await act(() => vi.advanceTimersByTimeAsync(60000));
    expect(tarefa).toHaveBeenCalledTimes(2);
  });

  it("não começa com a aba oculta e roda ao ficar visível", async () => {
    vi.useFakeTimers();
    definirAbaOculta(true);
    const tarefa = vi.fn(async () => undefined);
    renderHook(() => useIntervaloVisivel(tarefa, 1000));
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(tarefa).not.toHaveBeenCalled();

    act(() => definirAbaOculta(false));
    expect(tarefa).toHaveBeenCalledTimes(1);
  });

  it("pausa sem interação pelo tempo de inatividade e retoma na próxima interação", async () => {
    vi.useFakeTimers();
    const tarefa = vi.fn(async () => undefined);
    renderHook(() => useIntervaloVisivel(tarefa, 1000, { inatividade: 3000 }));
    await act(() => vi.advanceTimersByTimeAsync(10000));
    // Roda em 0, 1 e 2 s; em 3 s já passou o tempo sem interação e para.
    expect(tarefa).toHaveBeenCalledTimes(3);

    act(() => window.dispatchEvent(new Event("keydown")));
    expect(tarefa).toHaveBeenCalledTimes(4);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(tarefa).toHaveBeenCalledTimes(5);
  });

  it("aborta a execução em curso ao desmontar", async () => {
    const sinais = [];
    const { unmount } = renderHook(() => useIntervaloVisivel((signal) => {
      sinais.push(signal);
      return new Promise(() => {});
    }, 1000));

    unmount();
    expect(sinais[0].aborted).toBe(true);
  });
});
