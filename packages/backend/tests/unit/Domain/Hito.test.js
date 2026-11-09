import { describe, expect, test } from "@jest/globals"
import { Hito } from "../../../src/domain/Hito.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"

describe("Hito", () => {
  const datos = {
    fecha: "2026-10-15",
    porcentajeConcrecion: 50,
    descripcion: "Se completó la mitad del desarrollo",
  }

  const crear = ({ fecha, porcentajeConcrecion, descripcion }) =>
    new Hito(fecha, porcentajeConcrecion, descripcion)

  test("se construye con datos válidos y convierte la fecha", () => {
    const hito = crear(datos)

    expect(hito.fecha).toEqual(new Date("2026-10-15"))
    expect(hito.porcentajeConcrecion).toBe(50)
    expect(hito.descripcion).toBe(datos.descripcion)
  })

  test.each([
    ["una fecha inválida", { fecha: "ayer" }],
    ["sin fecha", { fecha: undefined }],
    ["un porcentaje negativo", { porcentajeConcrecion: -10 }],
    ["un porcentaje mayor a 100", { porcentajeConcrecion: 110 }],
    ["un porcentaje decimal", { porcentajeConcrecion: 50.5 }],
    ["una descripción vacía", { descripcion: "  " }],
    ["sin descripción", { descripcion: undefined }],
  ])("rechaza %s", (_caso, cambio) => {
    expect(() => crear({ ...datos, ...cambio })).toThrow(DomainValidationError)
  })

  test("validarCambios revisa solo los campos presentes", () => {
    expect(() =>
      Hito.validarCambios({ porcentajeConcrecion: 80 }),
    ).not.toThrow()
    expect(() => Hito.validarCambios({})).not.toThrow()
    expect(() => Hito.validarCambios({ descripcion: "" })).toThrow(
      DomainValidationError,
    )
    expect(() => Hito.validarCambios({ fecha: "ayer" })).toThrow(
      DomainValidationError,
    )
  })
})
