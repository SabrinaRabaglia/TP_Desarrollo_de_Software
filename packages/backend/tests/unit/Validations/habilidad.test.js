import { describe, expect, jest, test } from "@jest/globals"
import validar from "../../../src/middlewares/validar.js"
import { BadRequestError } from "../../../src/errors/ApplicationErrors.js"
import { habilidadSchema } from "../../../src/validations/habilidad.js"

const mockRes = () => ({})

describe("validación de habilidades", () => {
  test("con body inválido (falta un campo), lanza BadRequestError", async () => {
    const req = { body: { titulo: "React", codigo: "react" } }
    const res = mockRes()
    const next = jest.fn()
    await validar(habilidadSchema)(req, res, next)
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })

  test("con un campo extra no declarado en el schema, lanza BadRequestError", async () => {
    const req = {
      body: {
        titulo: "React",
        codigo: "react",
        descripcion: "desc",
        extra: "no debería estar",
      },
    }
    const res = mockRes()
    const next = jest.fn()
    await validar(habilidadSchema)(req, res, next)
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })

  test("con body inválido, lanza BadRequestError", async () => {
    const req = { params: { id: "1" }, body: {} }
    const res = mockRes()
    const next = jest.fn()
    await validar(habilidadSchema)(req, res, next) // Se ejecuta normalmente
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError)) // Verificas el next
  })
})
