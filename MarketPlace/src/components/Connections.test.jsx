import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Connections from "./Connections.jsx";

const ana = {
  id: 1,
  nome: "Ana Souza",
  curso: "Ciência da Computação · 6º período",
  cidade: "Vitória, ES",
  inicial: "AS",
  bio: "Desenvolvedora front-end interessada em interfaces acessíveis e projetos colaborativos.",
  habilidades: ["React", "JavaScript", "UX/UI Design"],
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Conexões", () => {
  it("persiste uma conexão antes de atualizar a interface", async () => {
    const user = userEvent.setup();
    render(<Connections usuarioId="conta-a" />);

    await user.click(within(screen.getByRole("navigation", { name: "Seções de conexões" })).getByRole("button", { name: /Encontrar pessoas/ }));
    const botoesConectar = screen.getAllByRole("button", { name: "+ Conectar" });
    await user.click(botoesConectar[0]);

    expect(JSON.parse(localStorage.getItem("marketfaesa-conexoes:conta-a"))).toEqual([1]);
    expect(screen.getByRole("button", { name: "✓ Conectado" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("mostra erro e não marca a conexão quando o armazenamento falha", async () => {
    const user = userEvent.setup();
    const setItemOriginal = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (key, value) {
      if (key === "marketfaesa-conexoes:conta-a") {
        throw new Error("armazenamento indisponível");
      }
      return setItemOriginal.call(this, key, value);
    });

    render(<Connections usuarioId="conta-a" />);
    await user.click(within(screen.getByRole("navigation", { name: "Seções de conexões" })).getByRole("button", { name: /Encontrar pessoas/ }));
    await user.click(screen.getAllByRole("button", { name: "+ Conectar" })[0]);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível salvar as conexões neste navegador.",
    );
    expect(screen.queryByRole("button", { name: "✓ Conectado" })).not.toBeInTheDocument();
  });

  it("aceita solicitações e persiste conexões e lista atualizada", async () => {
    localStorage.setItem("marketfaesa-solicitacoes-recebidas:conta-a", JSON.stringify([ana]));
    const user = userEvent.setup();
    render(<Connections usuarioId="conta-a" />);

    await user.click(screen.getByRole("button", { name: /Solicitações/ }));
    await user.click(screen.getByRole("button", { name: "Aceitar" }));

    expect(JSON.parse(localStorage.getItem("marketfaesa-conexoes:conta-a"))).toEqual([1]);
    expect(JSON.parse(localStorage.getItem("marketfaesa-solicitacoes-recebidas:conta-a"))).toEqual([]);
    expect(screen.getByText("Nenhuma solicitação pendente")).toBeInTheDocument();
  });


  it("abre o perfil pelo teclado com Espaço", async () => {
    const user = userEvent.setup();
    render(<Connections usuarioId="conta-a" />);

    await user.click(within(screen.getByRole("navigation", { name: "Seções de conexões" })).getByRole("button", { name: /Encontrar pessoas/ }));
    const cartaoAna = screen.getByRole("button", { name: /Ana Souza/ });
    cartaoAna.focus();
    await user.keyboard(" ");

    expect(screen.getByRole("heading", { level: 1, name: "Ana Souza" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "← Voltar para pessoas" })).toBeInTheDocument();
  });

  it("não abre o perfil ao usar Enter no botão Conectar do cartão", async () => {
    const user = userEvent.setup();
    render(<Connections usuarioId="conta-a" />);

    await user.click(within(screen.getByRole("navigation", { name: "Seções de conexões" })).getByRole("button", { name: /Encontrar pessoas/ }));
    const botaoConectar = screen.getAllByRole("button", { name: "+ Conectar" })[0];
    botaoConectar.focus();
    await user.keyboard("{Enter}");

    expect(screen.queryByRole("heading", { level: 1, name: "Ana Souza" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "✓ Conectado" })).toBeInTheDocument();
  });

  it("ignora IDs e solicitações inválidos no armazenamento", async () => {
    localStorage.setItem("marketfaesa-conexoes:conta-a", JSON.stringify([null, {}, 999, 2, "1"]));
    localStorage.setItem(
      "marketfaesa-solicitacoes-recebidas:conta-a",
      JSON.stringify([null, 42, { id: 999 }, ana, { id: "2", habilidades: "inválido" }]),
    );
    const user = userEvent.setup();
    render(<Connections usuarioId="conta-a" />);

    expect(screen.getByRole("heading", { name: "Lucas Martins" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Ana Souza" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Solicitações/ }));
    expect(screen.getByRole("heading", { name: "Ana Souza" })).toBeInTheDocument();
    expect(screen.getByText("1 pendente")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("mantém as conexões isoladas por conta", async () => {
    localStorage.setItem("marketfaesa-conexoes:conta-a", JSON.stringify([2]));
    const user = userEvent.setup();
    render(<Connections usuarioId="conta-b" />);

    await user.click(within(screen.getByRole("navigation", { name: "Seções de conexões" })).getByRole("button", { name: /Encontrar pessoas/ }));
    await user.click(screen.getAllByRole("button", { name: "+ Conectar" })[0]);

    expect(JSON.parse(localStorage.getItem("marketfaesa-conexoes:conta-a"))).toEqual([2]);
    expect(JSON.parse(localStorage.getItem("marketfaesa-conexoes:conta-b"))).toEqual([1]);
  });
});
