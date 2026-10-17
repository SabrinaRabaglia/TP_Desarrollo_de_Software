import { beforeEach, describe, expect, test } from "@jest/globals"
import Notificacion from "../../../src/domain/Notificacion.js"
import MedioDeContacto from "../../../src/domain/MedioDeContacto.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"

describe("Notificacion", () => {
  let datos

  beforeEach(() => {
    datos = {
      contenido: "Tu perfil encaja con nuestro proyecto",
      colectivo: { nombre: "Huerta Comunitaria Sur" },
      personaColaboradora: { nombreFantasia: "anag" },
      perfil: { descripcion: "Desarrollo frontend" },
    }
  })

  test("se construye con sus datos, la fecha actual y sin medios externos", () => {
    const antes = new Date()

    const notificacion = new Notificacion(datos)

    expect(notificacion).toEqual({
      ...datos,
      fecha: expect.any(Date),
      mediosExternosUtilizados: [],
    })
    expect(notificacion.fecha.getTime()).toBeGreaterThanOrEqual(antes.getTime())
  })

  test.each([
    ["sin contenido", { contenido: undefined }],
    ["con contenido en blanco", { contenido: "   " }],
    ["sin colectivo", { colectivo: undefined }],
    ["sin persona colaboradora", { personaColaboradora: undefined }],
    ["sin perfil", { perfil: undefined }],
  ])("tira DomainValidationError %s", (_caso, cambio) => {
    expect(() => new Notificacion({ ...datos, ...cambio })).toThrow(
      DomainValidationError,
    )
  })

  test("registra los medios externos por los que se envió", () => {
    const notificacion = new Notificacion(datos)
    const medios = [new MedioDeContacto("EMAIL", "ana@example.com")]

    notificacion.registrarMediosExternos(medios)

    expect(notificacion.mediosExternosUtilizados).toEqual(medios)
  })
})
