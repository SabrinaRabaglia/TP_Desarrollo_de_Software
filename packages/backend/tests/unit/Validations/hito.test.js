import { describe, expect, jest, test } from "@jest/globals"
import validar from "../../../src/middlewares/validar.js"
import { BadRequestError } from "../../../src/errors/ApplicationErrors.js"
import {
  cambiosDeHitoSchema,
  hitoSchema,
} from "../../../src/validations/hito.js"

const hitoValido = {
  fecha: "2026-10-15T00:00:00.000Z",
  porcentajeConcrecion: 40,
  descripcion: "Primera entrega",
}

const validarBody = (schema, body) => {
  const req = { body }
  const next = jest.fn()
  validar(schema)(req, {}, next)
  return { req, next }
}

describe("validación de hitos", () => {
  test("un body válido pasa con la fecha convertida a Date", () => {
    const { req, next } = validarBody(hitoSchema, hitoValido)

    expect(next).toHaveBeenCalledWith()
    expect(req.body).toEqual({
      ...hitoValido,
      fecha: new Date(hitoValido.fecha),
    })
  })

  test.each([
    ["sin fecha", { fecha: undefined }],
    ["con fecha nula", { fecha: null }],
    ["con una fecha que no se entiende", { fecha: "ayer" }],
    ["con una fecha que no es ISO", { fecha: "10/01/2026" }],
    ["con un día que no existe", { fecha: "2026-02-30" }],
    ["con fecha futura", { fecha: "2999-01-01T00:00:00.000Z" }],
    ["con porcentaje negativo", { porcentajeConcrecion: -1 }],
    ["con porcentaje mayor a 100", { porcentajeConcrecion: 101 }],
    ["con porcentaje decimal", { porcentajeConcrecion: 40.5 }],
    ["con descripción vacía", { descripcion: "   " }],
    ["con un campo desconocido", { proyecto: "otro" }],
  ])("%s pasa BadRequestError a next", (_caso, cambio) => {
    const { next } = validarBody(hitoSchema, { ...hitoValido, ...cambio })

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })

  test("admite el día de hoy aunque todavía no haya terminado", () => {
    const hoy = new Date().toISOString().slice(0, 10)

    expect(
      validarBody(hitoSchema, { ...hitoValido, fecha: hoy }).next,
    ).toHaveBeenCalledWith()
  })

  test("los cambios de un hito admiten cualquier subconjunto de campos", () => {
    const { req, next } = validarBody(cambiosDeHitoSchema, {
      porcentajeConcrecion: 80,
    })

    expect(next).toHaveBeenCalledWith()
    expect(req.body).toEqual({ porcentajeConcrecion: 80 })
  })

  test("los cambios de un hito aplican las mismas reglas por campo", () => {
    expect(
      validarBody(cambiosDeHitoSchema, { fecha: "2999-01-01" }).next,
    ).toHaveBeenCalledWith(expect.any(BadRequestError))
    expect(
      validarBody(cambiosDeHitoSchema, { descripcion: "" }).next,
    ).toHaveBeenCalledWith(expect.any(BadRequestError))
    expect(
      validarBody(cambiosDeHitoSchema, { otro: 1 }).next,
    ).toHaveBeenCalledWith(expect.any(BadRequestError))
  })
})
