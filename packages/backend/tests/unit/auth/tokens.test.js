import { afterEach, describe, expect, test } from "@jest/globals"
import jwt from "jsonwebtoken"
import {
  firmar,
  usaSecretoDeDesarrollo,
  verificar,
} from "../../../src/auth/tokens.js"
import { NoAutenticado } from "../../../src/errors/ApplicationErrors.js"

const usuario = {
  id: "65f1a2b3c4d5e6f708192a10",
  rol: "COLECTIVO",
  entidad: "65f1a2b3c4d5e6f708192a01",
}

const entornoOriginal = { ...process.env }

afterEach(() => {
  process.env = { ...entornoOriginal }
})

describe("tokens", () => {
  test("un token firmado se verifica y trae el usuario, su rol y su entidad", () => {
    const payload = verificar(firmar(usuario))

    expect(payload).toMatchObject({
      sub: usuario.id,
      rol: "COLECTIVO",
      entidad: usuario.entidad,
    })
  })

  test("vence según JWT_EXPIRA_EN y por defecto a las 8 horas", () => {
    process.env.JWT_EXPIRA_EN = "15m"
    const corto = verificar(firmar(usuario))
    delete process.env.JWT_EXPIRA_EN
    const porDefecto = verificar(firmar(usuario))

    expect(corto.exp - corto.iat).toBe(15 * 60)
    expect(porDefecto.exp - porDefecto.iat).toBe(8 * 60 * 60)
  })

  test.each([
    ["basura", () => "no-es-un-token"],
    [
      "firmado con otro secreto",
      () => jwt.sign({ sub: usuario.id }, "otro-secreto"),
    ],
    [
      "vencido",
      () => {
        process.env.JWT_EXPIRA_EN = "-1s"
        return firmar(usuario)
      },
    ],
  ])("rechaza un token %s", (_caso, crearToken) => {
    const token = crearToken()

    expect(() => verificar(token)).toThrow(NoAutenticado)
  })

  test("sin JWT_SECRET usa el secreto de desarrollo fuera de producción", () => {
    delete process.env.JWT_SECRET
    process.env.NODE_ENV = "development"

    expect(usaSecretoDeDesarrollo()).toBe(true)
    process.env.JWT_SECRET = "un-secreto-propio"
    expect(usaSecretoDeDesarrollo()).toBe(false)
  })

  test("sin JWT_SECRET en producción no firma tokens", () => {
    delete process.env.JWT_SECRET
    process.env.NODE_ENV = "production"

    expect(() => usaSecretoDeDesarrollo()).toThrow("JWT_SECRET")
    expect(() => firmar(usuario)).toThrow("JWT_SECRET")
  })
})
