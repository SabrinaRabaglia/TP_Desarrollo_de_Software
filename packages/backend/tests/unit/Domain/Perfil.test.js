import { beforeEach, describe, expect, test } from "@jest/globals"
import Perfil from "../../../src/domain/Perfil.js"
import { UnidadCompromiso } from "../../../src/domain/enums/UnidadCompromiso.js"
import { ModalidadColaboracion } from "../../../src/domain/enums/ModalidadColaboracion.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"

describe("Perfil", () => {
  let datos

  beforeEach(() => {
    datos = {
      nombre: "Tester",
      descripcion: "Testing E2E con Cypress",
      unidadCompromiso: UnidadCompromiso.HORAS_MENSUALES,
      cantidadHoras: 5,
      modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
      habilidadesRequeridas: ["cypress"],
      habilidadesOpcionales: ["soap_ui"],
    }
  })

  test("se construye con todos sus datos", () => {
    expect({ ...new Perfil(datos) }).toEqual(datos)
  })

  test("el nombre es opcional", () => {
    expect(new Perfil({ ...datos, nombre: undefined }).nombre).toBeNull()
  })

  test.each([
    ["sin descripción", { descripcion: "" }],
    [
      "con una unidad de compromiso inválida",
      { unidadCompromiso: "HORAS_ANUALES" },
    ],
    ["sin unidad de compromiso", { unidadCompromiso: undefined }],
    ["con cantidad de horas en cero", { cantidadHoras: 0 }],
    ["con cantidad de horas negativa", { cantidadHoras: -3 }],
    ["con cantidad de horas no entera", { cantidadHoras: 2.5 }],
    ["sin modalidades de colaboración", { modalidadesColaboracion: [] }],
    [
      "con una modalidad inválida",
      { modalidadesColaboracion: ["VOLUNTARIADO"] },
    ],
    ["sin habilidades requeridas", { habilidadesRequeridas: [] }],
    ["sin habilidades opcionales", { habilidadesOpcionales: [] }],
    [
      "con habilidades requeridas que no son una lista",
      { habilidadesRequeridas: undefined },
    ],
  ])("tira DomainValidationError %s", (_caso, cambio) => {
    expect(() => new Perfil({ ...datos, ...cambio })).toThrow(
      DomainValidationError,
    )
  })

  test("actualizar reemplaza los datos", () => {
    const perfil = new Perfil(datos)
    const nuevos = {
      ...datos,
      nombre: undefined,
      descripcion: "Analista de datos",
      cantidadHoras: 15,
      modalidadesColaboracion: [ModalidadColaboracion.CON_INCENTIVO_ECONOMICO],
    }

    perfil.actualizar(nuevos)

    expect({ ...perfil }).toEqual({ ...nuevos, nombre: null })
  })

  test("actualizar con datos inválidos no modifica el perfil", () => {
    const perfil = new Perfil(datos)

    expect(() =>
      perfil.actualizar({ ...datos, habilidadesRequeridas: [] }),
    ).toThrow(DomainValidationError)
    expect({ ...perfil }).toEqual(datos)
  })
})
