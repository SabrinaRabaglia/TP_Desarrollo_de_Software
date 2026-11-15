import { describe, expect, test } from "@jest/globals"
import {
  emitirCodigo,
  leerCodigo,
} from "../../../src/auth/codigoDeVinculacion.js"

const personaId = "65f1a2b3c4d5e6f708192a10"
const ahora = new Date("2026-11-15T12:00:00.000Z")
const minutosDespues = (minutos) => new Date(ahora.getTime() + minutos * 60_000)

describe("código de vinculación", () => {
  test("se lee de vuelta la persona para la que se emitió", () => {
    const { codigo } = emitirCodigo(personaId, ahora)

    expect(leerCodigo(codigo, minutosDespues(14))).toBe(personaId)
  })

  test("vence a los 15 minutos", () => {
    const { codigo, venceEn } = emitirCodigo(personaId, ahora)

    expect(venceEn).toEqual(minutosDespues(15))
    expect(leerCodigo(codigo, minutosDespues(15))).toBeNull()
  })

  test("entra en el parámetro start de Telegram", () => {
    const { codigo } = emitirCodigo(personaId, ahora)

    expect(codigo.length).toBeLessThanOrEqual(64)
    expect(codigo).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  test("no sirve si se cambia la persona", () => {
    const { codigo } = emitirCodigo(personaId, ahora)
    const otraPersona = "75f1a2b3c4d5e6f708192a10" + codigo.slice(24)

    expect(leerCodigo(otraPersona, ahora)).toBeNull()
  })

  test("no sirve si se estira el vencimiento", () => {
    const { codigo } = emitirCodigo(personaId, ahora)
    const masTarde = emitirCodigo(personaId, minutosDespues(60)).codigo
    const estirado = masTarde.slice(0, 31) + codigo.slice(31)

    expect(leerCodigo(estirado, minutosDespues(16))).toBeNull()
  })

  test.each([
    ["vacío", ""],
    ["corto", "abc"],
    ["con caracteres fuera del alfabeto", "!".repeat(63)],
    ["sin texto", undefined],
  ])("un código %s se rechaza sin tirar", (_caso, codigo) => {
    expect(leerCodigo(codigo, ahora)).toBeNull()
  })
})
