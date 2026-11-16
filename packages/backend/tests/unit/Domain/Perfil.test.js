import { beforeEach, describe, expect, test } from "@jest/globals"
import mongoose from "mongoose"
import Perfil from "../../../src/domain/Perfil.js"
import HabilidadModel from "../../../src/schemas/habilidadSchema.js"
import { UnidadCompromiso } from "../../../src/domain/enums/UnidadCompromiso.js"
import { ModalidadColaboracion } from "../../../src/domain/enums/ModalidadColaboracion.js"
import {
  DomainRuleError,
  DomainValidationError,
} from "../../../src/domain/errors/DomainErrors.js"

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
      busquedaAbierta: true,
      busquedaAbiertaHasta: null,
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

  test("tiene alguna requerida entre las habilidades si coincide con al menos una", () => {
    const perfil = new Perfil({
      ...datos,
      habilidadesRequeridas: ["cypress", "postman"],
    })

    expect(perfil.tieneAlgunaRequeridaEntre(["cypress"])).toBe(true)
    expect(perfil.tieneAlgunaRequeridaEntre(["jmeter", "postman"])).toBe(true)
    expect(perfil.tieneAlgunaRequeridaEntre(["jmeter"])).toBe(false)
    expect(perfil.tieneAlgunaRequeridaEntre([])).toBe(false)
  })

  test("las habilidades opcionales no alcanzan para tener una requerida", () => {
    const perfil = new Perfil({
      ...datos,
      habilidadesRequeridas: ["cypress"],
      habilidadesOpcionales: ["postman"],
    })

    expect(perfil.tieneAlgunaRequeridaEntre(["postman"])).toBe(false)
  })

  test("reconoce una requerida sea ObjectId, texto o documento", () => {
    const habilidad = (codigo) =>
      new HabilidadModel({ titulo: codigo, codigo, descripcion: codigo })
    const cypress = habilidad("cypress")
    const postman = habilidad("postman")
    const perfil = new Perfil({
      ...datos,
      habilidadesRequeridas: [cypress._id, postman._id],
    })

    expect(perfil.tieneAlgunaRequeridaEntre([cypress.id])).toBe(true)
    expect(perfil.tieneAlgunaRequeridaEntre([postman])).toBe(true)
    expect(perfil.tieneAlgunaRequeridaEntre([postman._id])).toBe(true)
    expect(
      perfil.tieneAlgunaRequeridaEntre([new mongoose.Types.ObjectId()]),
    ).toBe(false)
  })

  test("quitar una postulación aceptada libera su lugar en el límite", () => {
    const aceptada = new mongoose.Types.ObjectId()
    const otra = new mongoose.Types.ObjectId()
    const perfil = new Perfil({ ...datos, limiteColaboraciones: 2 })
    perfil.agregarPostulacion(aceptada)
    perfil.agregarPostulacion(otra)
    expect(() => perfil.assertPuedeAceptarPostulaciones()).toThrow(
      DomainValidationError,
    )

    perfil.quitarPostulacion(aceptada.toString())

    expect(perfil.postulacionesAceptadas).toEqual([otra])
    expect(() => perfil.assertPuedeAceptarPostulaciones()).not.toThrow()
  })

  describe("búsqueda de colaboraciones", () => {
    const hoy = new Date("2026-11-15T12:00:00.000Z")
    const ayer = new Date("2026-11-14T12:00:00.000Z")
    const manana = new Date("2026-11-16T12:00:00.000Z")

    test("sin fecha límite queda abierta hasta que se cierra a mano", () => {
      expect(new Perfil(datos).tieneBusquedaAbierta(hoy)).toBe(true)
      expect(
        new Perfil({ ...datos, busquedaAbierta: false }).tieneBusquedaAbierta(
          hoy,
        ),
      ).toBe(false)
    })

    test("con fecha límite se cierra sola cuando la fecha pasa", () => {
      const perfil = new Perfil({ ...datos, busquedaAbiertaHasta: manana })

      expect(perfil.tieneBusquedaAbierta(hoy)).toBe(true)
      expect(perfil.tieneBusquedaAbierta(new Date(manana.getTime() + 1))).toBe(
        false,
      )
    })

    test("con la búsqueda cerrada no admite postulaciones", () => {
      const cerrado = new Perfil({ ...datos, busquedaAbierta: false })
      const vencido = new Perfil({ ...datos, busquedaAbiertaHasta: ayer })

      expect(() => cerrado.assertBusquedaAbierta(hoy)).toThrow(DomainRuleError)
      expect(() => vencido.assertBusquedaAbierta(hoy)).toThrow(
        "La búsqueda de colaboraciones para este perfil está cerrada.",
      )
      expect(() => new Perfil(datos).assertBusquedaAbierta(hoy)).not.toThrow()
    })

    test("rechaza una fecha límite que no es una fecha", () => {
      expect(
        () => new Perfil({ ...datos, busquedaAbiertaHasta: "mañana" }),
      ).toThrow(DomainValidationError)
    })
  })

  describe("reemplazar los datos de un perfil con colaboraciones", () => {
    const hoy = new Date("2026-11-15T12:00:00.000Z")
    const ayer = new Date("2026-11-14T12:00:00.000Z")
    const manana = new Date("2026-11-16T12:00:00.000Z")
    let perfil, aceptadas

    beforeEach(() => {
      aceptadas = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]
      perfil = new Perfil({
        ...datos,
        limiteColaboraciones: 2,
        postulacionesAceptadas: aceptadas,
      })
    })

    test("no deja bajar el límite por debajo de las aceptadas", () => {
      expect(() =>
        perfil.reemplazarDatos({ ...datos, limiteColaboraciones: 1 }, hoy),
      ).toThrow(
        new DomainRuleError(
          "El límite no puede ser menor a las colaboraciones ya aceptadas (2).",
        ),
      )
    })

    test("un cambio válido conserva las colaboraciones aceptadas", () => {
      const editado = perfil.reemplazarDatos(
        { ...datos, descripcion: "Otra descripción", limiteColaboraciones: 3 },
        hoy,
      )

      expect(editado.descripcion).toBe("Otra descripción")
      expect(editado.limiteColaboraciones).toBe(3)
      expect(editado.postulacionesAceptadas).toEqual(aceptadas)
      expect(() => editado.assertPuedeAceptarPostulaciones()).not.toThrow()
    })

    test("quitar el límite siempre se puede", () => {
      const editado = perfil.reemplazarDatos(
        { ...datos, limiteColaboraciones: null },
        hoy,
      )

      expect(editado.limiteColaboraciones).toBeNull()
      expect(editado.postulacionesAceptadas).toEqual(aceptadas)
    })

    test("una fecha límite nueva tiene que ser futura", () => {
      expect(() =>
        perfil.reemplazarDatos({ ...datos, busquedaAbiertaHasta: ayer }, hoy),
      ).toThrow(
        new DomainValidationError(
          "La fecha límite de búsqueda no puede ser anterior a la actual.",
        ),
      )
      expect(
        perfil.reemplazarDatos({ ...datos, busquedaAbiertaHasta: manana }, hoy)
          .busquedaAbiertaHasta,
      ).toEqual(manana)
    })

    test("una búsqueda ya vencida se puede seguir editando sin tocar su fecha", () => {
      const vencido = new Perfil({ ...datos, busquedaAbiertaHasta: ayer })

      const editado = vencido.reemplazarDatos(
        { ...vencido.datosEditables(), descripcion: "Otra descripción" },
        hoy,
      )

      expect(editado.descripcion).toBe("Otra descripción")
      expect(editado.busquedaAbiertaHasta).toEqual(ayer)
    })
  })
})
