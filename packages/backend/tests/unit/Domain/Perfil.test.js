import { beforeEach, describe, expect, test } from "@jest/globals"
import mongoose from "mongoose"
import Perfil from "../../../src/domain/Perfil.js"
import HabilidadModel from "../../../src/schemas/habilidadSchema.js"
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
      postulacionesAceptadas: [],
      limiteColaboraciones: null,
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
  ])("lanza DomainValidationError %s", (_caso, cambio) => {
    expect(() => new Perfil({ ...datos, ...cambio })).toThrow(
      DomainValidationError,
    )
  })

  test("cuenta cuántas de sus habilidades opcionales tiene una persona", () => {
    const perfil = new Perfil({
      ...datos,
      habilidadesOpcionales: ["soap_ui", "postman", "jmeter"],
    })

    expect(perfil.cantidadDeHabilidadesOpcionalesDe({ habilidades: [] })).toBe(
      0,
    )
    expect(
      perfil.cantidadDeHabilidadesOpcionalesDe({
        habilidades: ["cypress", "postman", "jmeter"],
      }),
    ).toBe(2)
  })

  describe("habilidades en las distintas formas en que llegan desde la base", () => {
    // Guardadas en el perfil son ObjectId; populadas son documentos de
    // Habilidad; en el query de la búsqueda son texto.
    const habilidad = (codigo) =>
      new HabilidadModel({ titulo: codigo, codigo, descripcion: codigo })
    const cypress = habilidad("cypress")
    const postman = habilidad("postman")
    const jmeter = habilidad("jmeter")

    test("un perfil guardado (ObjectId) se compara con texto y con documentos", () => {
      const perfil = new Perfil({
        ...datos,
        habilidadesRequeridas: [cypress._id, postman._id],
        habilidadesOpcionales: [jmeter._id, postman._id],
      })

      expect(perfil.estaCubiertoPor([cypress.id, postman.id])).toBe(true)
      expect(perfil.estaCubiertoPor([cypress, postman])).toBe(true)
      expect(perfil.estaCubiertoPor([cypress.id])).toBe(false)
      expect(
        perfil.cantidadDeHabilidadesOpcionalesDe({
          habilidades: [jmeter, cypress],
        }),
      ).toBe(1)
    })

    test("un perfil con habilidades populadas se compara con ObjectId y texto", () => {
      const perfil = new Perfil({
        ...datos,
        habilidadesRequeridas: [cypress, postman],
        habilidadesOpcionales: [jmeter, postman],
      })

      expect(perfil.estaCubiertoPor([cypress._id, postman._id])).toBe(true)
      expect(perfil.estaCubiertoPor([postman.id])).toBe(false)
      expect(
        perfil.cantidadDeHabilidadesOpcionalesDe({
          habilidades: [jmeter._id, postman.id],
        }),
      ).toBe(2)
    })

    test("ObjectId distintos con el mismo formato no se confunden", () => {
      const perfil = new Perfil({
        ...datos,
        habilidadesRequeridas: [new mongoose.Types.ObjectId()],
      })

      expect(perfil.estaCubiertoPor([new mongoose.Types.ObjectId()])).toBe(
        false,
      )
    })
  })

  test("está cubierto por un conjunto de habilidades si incluye todas sus requeridas", () => {
    const perfil = new Perfil({
      ...datos,
      habilidadesRequeridas: ["cypress", "postman"],
    })

    expect(perfil.estaCubiertoPor(["cypress", "postman", "jmeter"])).toBe(true)
    expect(perfil.estaCubiertoPor(["cypress"])).toBe(false)
    expect(perfil.estaCubiertoPor([])).toBe(false)
  })
})
