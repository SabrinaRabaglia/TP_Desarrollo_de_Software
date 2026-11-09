import { describe, expect, jest, test } from "@jest/globals"
import validar from "../../../src/middlewares/validar.js"
import { BadRequestError } from "../../../src/errors/ApplicationErrors.js"
import {
  busquedaPersonasSchema,
  personaColaboradoraSchema,
} from "../../../src/validations/personaColaboradora.js"

const mockRes = () => ({})

describe("validación de la búsqueda de personas colaboradoras", () => {
  const PERFIL_ID = "65f1a2b3c4d5e6f708192a11"
  const OTRO_PERFIL_ID = "65f1a2b3c4d5e6f708192a12"

  const validarQuery = (query) => {
    const req = { query }
    const next = jest.fn()
    validar(busquedaPersonasSchema, "query")(req, mockRes(), next)
    return { req, next }
  }

  test("sin perfiles pasa con la query vacía", () => {
    const { req, next } = validarQuery({})

    expect(next).toHaveBeenCalledWith()
    expect(req.query).toEqual({})
  })

  test("un solo perfil queda como lista de uno", () => {
    const { req, next } = validarQuery({ perfiles: PERFIL_ID })

    expect(next).toHaveBeenCalledWith()
    expect(req.query.perfiles).toEqual([PERFIL_ID])
  })

  test("varios perfiles se conservan en orden", () => {
    const { req } = validarQuery({ perfiles: [PERFIL_ID, OTRO_PERFIL_ID] })

    expect(req.query.perfiles).toEqual([PERFIL_ID, OTRO_PERFIL_ID])
  })

  test.each([
    ["un perfil que no es un id", { perfiles: "abc" }],
    ["una lista con un id inválido", { perfiles: [PERFIL_ID, "abc"] }],
  ])("con %s pasa BadRequestError a next", (_caso, query) => {
    expect(validarQuery(query).next).toHaveBeenCalledWith(
      expect.any(BadRequestError),
    )
  })
})

describe("validación de personas colaboradoras", () => {
  test("sin nombreFantasia, lanza BadRequestError", async () => {
    const req = { body: {} }
    const res = mockRes()
    const next = jest.fn()
    await validar(personaColaboradoraSchema)(req, res, next)
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })

  test.each(["react", "b8c65bfd-1234-4a12-8b12-abcdef123456"])(
    "con un id de habilidad %s que no tiene formato ObjectId, lanza BadRequestError",
    async (idInvalido) => {
      const req = {
        body: { nombreFantasia: "anon123", habilidades: [idInvalido] },
      }
      const res = mockRes()
      const next = jest.fn()
      await validar(personaColaboradoraSchema)(req, res, next)
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
    },
  )

  test("con una cuenta de tipo inválido (no GITHUB ni GITLAB), lanza BadRequestError", async () => {
    const req = {
      body: {
        nombreFantasia: "anon123",
        cuentas: [{ nombreUsuario: "anagomez", tipo: "MASTODON" }],
      },
    }
    const res = mockRes()
    const next = jest.fn()
    await validar(personaColaboradoraSchema)(req, res, next)
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })

  test("con un medio de contacto de tipo inválido, lanza BadRequestError", async () => {
    const req = {
      body: {
        nombreFantasia: "anon123",
        mediosDeContacto: [{ tipo: "TELEGRAM_FALSO", valor: "12345" }],
      },
    }
    const res = mockRes()
    const next = jest.fn()
    await validar(personaColaboradoraSchema)(req, res, next)
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })

  test("con un campo extra no declarado en el schema, lanza BadRequestError", async () => {
    const req = {
      body: { nombreFantasia: "anon123", extra: "no debería estar" },
    }
    const res = mockRes()
    const next = jest.fn()
    await validar(personaColaboradoraSchema)(req, res, next)
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })

  test("con body inválido, lanza BadRequestError", async () => {
    const req = { params: { id: "1" }, body: {} }
    const res = mockRes()
    const next = jest.fn()
    await validar(personaColaboradoraSchema)(req, res, next)
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })
})
