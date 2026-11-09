import { describe, expect, jest, test } from "@jest/globals"
import validar from "../../../src/middlewares/validar.js"
import { BadRequestError } from "../../../src/errors/ApplicationErrors.js"
import { loginSchema } from "../../../src/validations/auth.js"

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
