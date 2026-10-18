import { describe, expect, jest, test } from "@jest/globals"
import validar from "../../../src/middlewares/validar.js"
import { BadRequestError } from "../../../src/errors/ApplicationErrors.js"
import { colectivoSchema } from "../../../src/validations/colectivo.js"

const PAIS_ID = "65f1a2b3c4d5e6f708192a01"
const PROVINCIA_ID = "65f1a2b3c4d5e6f708192a02"

const mockRes = () => ({})

describe("validación de colectivos", () => {
  test("con body inválido (falta un campo), tira BadRequestError", async () => {
    const req = {
      body: {
        nombre: "Asamblea Ambiental del Sur",
        descripcion:
          "Grupo autoconvocado para la protección de la cuenca y humedales locales.",
      },
    }
    const res = mockRes()
    const next = jest.fn()

    await validar(colectivoSchema)(req, res, next)
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })

  test.each([
    ["pais", { pais: "Argentina" }],
    ["provincia", { provincia: "2" }],
  ])(
    "con un %s que no es un id válido, tira BadRequestError",
    async (_campo, cambios) => {
      const req = {
        body: {
          nombre: "Asamblea",
          descripcion: "Descripción",
          tipo: "Asamblea",
          ...cambios,
        },
      }
      const next = jest.fn()

      await validar(colectivoSchema)(req, mockRes(), next)

      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
    },
  )

  test("con un campo extra no declarado en el schema, tira BadRequestError", async () => {
    const req = {
      body: {
        nombre: "Asamblea Ambiental del Sur",
        descripcion:
          "Grupo autoconvocado para la protección de la cuenca y humedales locales.",
        tipo: "asamblea",
        pais: PAIS_ID,
        provincia: PROVINCIA_ID,
        ciudad: "Almagro",
        extra: "no debería estar",
      },
    }
    const res = mockRes()
    const next = jest.fn()

    await validar(colectivoSchema)(req, res, next) // Se ejecuta normalmente
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })

  test("con body invalido tira BadRequestError", async () => {
    const req = { params: { id: "1" }, body: { nombre: "Solo nombre" } }
    const res = mockRes()
    const next = jest.fn()
    await validar(colectivoSchema)(req, res, next)
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })
})
