import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PeopleSkills from "./PeopleSkills.jsx";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("conexões em Habilidades", () => {
  it("ignora valores inválidos ao ler conexões persistidas", async () => {
    localStorage.setItem("marketfaesa-conexoes:conta-a", JSON.stringify([null, {}, "1", 999, 2]));
    const user = userEvent.setup();
    render(<PeopleSkills usuarioId="conta-a" />);

    await user.click(screen.getByRole("button", { name: /Lucas Martins/ }));

    expect(screen.getByRole("button", { name: "✓ Conectado" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("salva a conexão por conta e atualiza o botão", async () => {
    const user = userEvent.setup();
    render(<PeopleSkills usuarioId="conta-a" />);

    await user.click(screen.getByRole("button", { name: /Ana Souza/ }));
    await user.click(screen.getByRole("button", { name: "+ Conectar" }));

    expect(screen.getByRole("button", { name: "✓ Conectado" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("marketfaesa-conexoes:conta-a"))).toEqual([1]);
  });

  it("não exibe conexão como salva quando o armazenamento falha", async () => {
    const user = userEvent.setup();
    const setItemOriginal = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (key, value) {
      if (key === "marketfaesa-conexoes:conta-a") {
        throw new Error("armazenamento indisponível");
      }
      return setItemOriginal.call(this, key, value);
    });

    render(<PeopleSkills usuarioId="conta-a" />);

    await user.click(screen.getByRole("button", { name: /Ana Souza/ }));
    await user.click(screen.getByRole("button", { name: "+ Conectar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível salvar esta conexão neste navegador.",
    );
    expect(screen.getByRole("button", { name: "+ Conectar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "✓ Conectado" })).not.toBeInTheDocument();
  });

  it("mantém conexões separadas entre contas", async () => {
    localStorage.setItem("marketfaesa-conexoes:conta-a", JSON.stringify([2]));
    const user = userEvent.setup();
    render(<PeopleSkills usuarioId="conta-b" />);

    await user.click(screen.getByRole("button", { name: /Ana Souza/ }));
    await user.click(screen.getByRole("button", { name: "+ Conectar" }));

    expect(JSON.parse(localStorage.getItem("marketfaesa-conexoes:conta-a"))).toEqual([2]);
    expect(JSON.parse(localStorage.getItem("marketfaesa-conexoes:conta-b"))).toEqual([1]);
  });
});
