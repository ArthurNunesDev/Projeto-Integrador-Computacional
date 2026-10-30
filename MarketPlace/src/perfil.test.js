import { beforeEach, describe, expect, it } from "vitest";
import {
  calcularProgressoPerfil,
  conquistaPerfilExibida,
  corpoAtualizacao,
  marcarConquistaPerfilExibida,
  montarUsuario,
} from "./perfil.js";

const API = {
  id: 7, nome: "Ana", email: "ana@faesa.br", curso: { id: 3, nome: "ADS" }, periodo: 3,
  cidade: "Vitória", bio: null, fotoUrl: null, criadoEm: "2026-10-01T10:00:00Z",
};

beforeEach(() => {
  localStorage.clear();
});

describe("montarUsuario e corpoAtualizacao", () => {
  it("converte o usuário da API em textos e guarda os valores crus para o PUT", () => {
    expect(montarUsuario(API)).toMatchObject({
      curso: "ADS", cursoId: 3, periodo: "3º período", periodoNumero: 3, bio: "",
    });
    expect(montarUsuario({ ...API, curso: null, periodo: null })).toMatchObject({
      curso: "", cursoId: null, periodo: "", periodoNumero: null,
    });
  });

  it("monta o corpo completo com as alterações por cima", () => {
    const usuario = montarUsuario(API);

    expect(corpoAtualizacao(usuario, { bio: "Olá", periodo: 4 })).toEqual({
      nome: "Ana", cursoId: 3, periodo: 4, cidade: "Vitória", bio: "Olá", fotoUrl: null,
    });
  });
});

describe("progresso do perfil", () => {
  it("chega a 100% só com todos os campos e ao menos uma habilidade publicada", () => {
    const usuario = { ...montarUsuario(API), bio: "Olá" };

    expect(calcularProgressoPerfil(usuario, 0)).toBe(86);
    expect(calcularProgressoPerfil(usuario, 2)).toBe(100);
    expect(calcularProgressoPerfil(null, 2)).toBe(0);
  });
});

describe("conquista de perfil completo", () => {
  it("mantém a conquista registrada mesmo se os dados do perfil forem removidos depois", () => {
    const usuario = { id: 7, nome: "Ana", email: "ana@faesa.br", curso: "ADS", periodo: "3º período", cidade: "Vitória", bio: "Olá" };
    marcarConquistaPerfilExibida(usuario);

    const perfilDepoisDaEdicao = { id: 7, nome: "Ana", email: "ana@faesa.br", curso: "", periodo: "", cidade: "", bio: "" };

    expect(conquistaPerfilExibida(perfilDepoisDaEdicao)).toBe(true);
    expect(conquistaPerfilExibida({ ...perfilDepoisDaEdicao, id: 8 })).toBe(false);
  });
});
