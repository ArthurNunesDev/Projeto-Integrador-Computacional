import { beforeEach, describe, expect, it } from "vitest";
import { montarUsuario } from "./perfil.js";

const API = { id: 7, nome: "Ana", email: "Ana@Faesa.br", curso: null, periodo: null };

beforeEach(() => {
  localStorage.clear();
});

describe("montarUsuario", () => {
  it("move o perfil salvo por e-mail para a chave por id", () => {
    localStorage.setItem("marketfaesa-perfil:ana@faesa.br", JSON.stringify({ bio: "Olá", cidade: "Serra" }));

    const usuario = montarUsuario(API);

    expect(usuario).toMatchObject({ bio: "Olá", cidade: "Serra" });
    expect(JSON.parse(localStorage.getItem("marketfaesa-perfil:7"))).toEqual({ bio: "Olá", cidade: "Serra" });
    expect(localStorage.getItem("marketfaesa-perfil:ana@faesa.br")).toBeNull();
  });

  it("não sobrescreve o perfil que já existe por id", () => {
    localStorage.setItem("marketfaesa-perfil:ana@faesa.br", JSON.stringify({ bio: "Antiga" }));
    localStorage.setItem("marketfaesa-perfil:7", JSON.stringify({ bio: "Atual" }));

    expect(montarUsuario(API).bio).toBe("Atual");
    expect(localStorage.getItem("marketfaesa-perfil:ana@faesa.br")).not.toBeNull();
  });
});
