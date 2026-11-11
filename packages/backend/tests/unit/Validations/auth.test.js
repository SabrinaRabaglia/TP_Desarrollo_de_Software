import { describe, expect, jest, test } from "@jest/globals"
import validar from "../../../src/middlewares/validar.js"
import { BadRequestError } from "../../../src/errors/ApplicationErrors.js"
import {
  loginSchema,
  registroPersonaSchema,
} from "../../../src/validations/auth.js"

const datos = { email: "huerta@colectivo.test", contrasena: "secreto123" }

describe("validación del login", () => {
  test("acepta email y contraseña", () => {
    const req = { body: datos }
    const next = jest.fn()

    validar(loginSchema)(req, {}, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.body).toEqual(datos)
  })

  test.each([
    ["sin email", { email: undefined }],
    ["con un email mal formado", { email: "huerta" }],
    ["sin contraseña", { contrasena: undefined }],
    ["con una contraseña de menos de 8 caracteres", { contrasena: "1234567" }],
    ["con un campo extra", { rol: "COLECTIVO" }],
  ])("rechaza el body %s", (_caso, cambios) => {
    const next = jest.fn()

    validar(loginSchema)({ body: { ...datos, ...cambios } }, {}, next)

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })
})

describe("validación del registro de una persona colaboradora", () => {
  const registro = {
    email: "lucia@persona.test",
    contrasena: "secreto123",
    persona: { nombreFantasia: "lucia.dev" },
  }

  test("acepta email, contraseña y los datos de la persona", () => {
    const req = { body: registro }
    const next = jest.fn()

    validar(registroPersonaSchema)(req, {}, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.body).toEqual(registro)
  })

  test.each([
    ["sin persona", { persona: undefined }],
    ["con una persona sin nombre de fantasía", { persona: {} }],
    ["con un email mal formado", { email: "lucia" }],
    ["con una contraseña de menos de 8 caracteres", { contrasena: "1234567" }],
    ["con un campo extra", { rol: "COLECTIVO" }],
    [
      "con un campo extra en la persona",
      { persona: { nombreFantasia: "lucia.dev", rol: "COLECTIVO" } },
    ],
  ])("rechaza el body %s", (_caso, cambios) => {
    const next = jest.fn()

    validar(registroPersonaSchema)(
      { body: { ...registro, ...cambios } },
      {},
      next,
    )

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })
})
