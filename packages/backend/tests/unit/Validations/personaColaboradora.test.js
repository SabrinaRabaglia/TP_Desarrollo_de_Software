import { describe, expect, jest, test } from "@jest/globals"
import validar from "../../../src/middlewares/validar.js"
import { BadRequestError } from "../../../src/errors/ApplicationErrors.js"
import { personaColaboradoraSchema } from "../../../src/validations/personaColaboradora.js"

const mockRes = () => ({})

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
