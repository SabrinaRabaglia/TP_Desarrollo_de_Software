import { describe, expect, jest, test } from "@jest/globals"
import validar from "../../../src/middlewares/validar.js"
import { BadRequestError } from "../../../src/errors/ApplicationErrors.js"
import { EstadoProyecto } from "../../../src/domain/enums/EstadoProyecto.js"
import {
  busquedaProyectosSchema,
  proyectoSchema,
} from "../../../src/validations/proyecto.js"

const proyectoValido = {
  titulo: "Plataforma de Colaboración",
  descripcion:
    "Desarrollo de plataforma para conectar colectivos y voluntarios.",
  colectivo: "65f1a2b3c4d5e6f708192a10",
  estado: EstadoProyecto.PUBLICADO,
  fechaCierre: null,
}

const mockRes = () => ({})

describe("validación de proyectos", () => {
  test("con una habilidad que no es un id pasa BadRequestError a next", async () => {
    const next = jest.fn()
    await validar(busquedaProyectosSchema, "query")(
      { query: { habilidades: "hola" } },
      mockRes(),
      next,
    )
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })

  test("con body inválido (falta un campo obligatorio), lanza BadRequestError", async () => {
    const req = {
      body: {
        titulo: "Proyecto Incompleto",
        descripcion: "Le faltan varios campos",
      },
    }
    const res = mockRes()
    const next = jest.fn()
    await validar(proyectoSchema)(req, res, next)
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })

  test.each([["colectivo", { colectivo: "Asamblea Ambiental del Sur" }]])(
    "con un %s que no es un id válido, lanza BadRequestError",
    async (_campo, cambios) => {
      const next = jest.fn()
      await validar(proyectoSchema)(
        { body: { ...proyectoValido, ...cambios } },
        mockRes(),
        next,
      )
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
    },
  )

  test.each([
    ["un campo extra no declarado en el schema", { campoInexistente: "no" }],
    [
      "la fecha de alta, que la asigna el servidor",
      { fechaAlta: "2026-09-01" },
    ],
  ])("con %s, lanza BadRequestError", async (_caso, extra) => {
    const req = { body: { ...proyectoValido, ...extra } }
    const res = mockRes()
    const next = jest.fn()
    await validar(proyectoSchema)(req, res, next)
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })

  test("con body inválido lanza BadRequestError", async () => {
    const req = { params: { id: "1" }, body: { titulo: "Solo título" } }
    const res = mockRes()
    const next = jest.fn()
    await validar(proyectoSchema)(req, res, next)
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })

  test.each([
    ["una dirección web", "https://mapa.example.org"],
    ["null, para quitar el enlace", null],
  ])("acepta como enlace %s", async (_caso, enlaceCodigoFuente) => {
    const next = jest.fn()
    await validar(proyectoSchema)(
      { body: { ...proyectoValido, enlaceCodigoFuente } },
      mockRes(),
      next,
    )
    expect(next).toHaveBeenCalledWith()
  })

  test.each([
    ["que no es una dirección", "mi repositorio"],
    ["que ejecuta código", "javascript:alert(1)"],
  ])("rechaza un enlace %s", async (_caso, enlaceCodigoFuente) => {
    const next = jest.fn()
    await validar(proyectoSchema)(
      { body: { ...proyectoValido, enlaceCodigoFuente } },
      mockRes(),
      next,
    )
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })
})
