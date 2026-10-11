import { describe, expect, test } from "@jest/globals"
import Perfil from "../../../src/domain/Perfil.js"
import { UnidadCompromiso } from "../../../src/domain/enums/UnidadCompromiso.js"
import { ModalidadColaboracion } from "../../../src/domain/enums/ModalidadColaboracion.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"

describe("Perfil", () => {
  const habilidadesRequeridas = ["hab-1"]
  const habilidadesOpcionales = ["hab-2"]
  const proyecto = { id: "proyecto-1" }

  test("se construye correctamente con todos los parámetros", () => {
    const perfil = new Perfil(
      "Tester",
      "Testing E2E con Cypress",
      UnidadCompromiso.HORAS_MENSUALES,
      5,
      [ModalidadColaboracion.GRATUITA],
      habilidadesRequeridas,
      habilidadesOpcionales,
      proyecto,
    )

    expect(perfil.nombre).toBe("Tester")
    expect(perfil.descripcion).toBe("Testing E2E con Cypress")
    expect(perfil.unidadCompromiso).toBe(UnidadCompromiso.HORAS_MENSUALES)
    expect(perfil.cantidadHoras).toBe(5)
    expect(perfil.modalidadesColaboracion).toEqual([ModalidadColaboracion.GRATUITA])
    expect(perfil.habilidadesRequeridas).toBe(habilidadesRequeridas)
    expect(perfil.habilidadesOpcionales).toBe(habilidadesOpcionales)
    expect(perfil.proyecto).toBe(proyecto)
  })

  test("se construye con los campos opcionales en sus valores por defecto", () => {
    const perfil = new Perfil(
      undefined,
      "Descripción",
      undefined,
      undefined,
      undefined,
      habilidadesRequeridas,
      habilidadesOpcionales,
      proyecto,
    )

    expect(perfil.nombre).toBeNull()
    expect(perfil.unidadCompromiso).toBeNull()
    expect(perfil.cantidadHoras).toBeNull()
    expect(perfil.modalidadesColaboracion).toEqual([])
  })

  test("tira DomainValidationError si falta la descripción", () => {
    expect(
      () =>
        new Perfil(
          "Tester",
          undefined,
          undefined,
          undefined,
          undefined,
          habilidadesRequeridas,
          habilidadesOpcionales,
          proyecto,
        ),
    ).toThrow(DomainValidationError)
  })

  test("tira DomainValidationError si faltan las habilidades requeridas", () => {
    expect(
      () =>
        new Perfil(
          "Tester",
          "Descripción",
          undefined,
          undefined,
          undefined,
          undefined,
          habilidadesOpcionales,
          proyecto,
        ),
    ).toThrow(DomainValidationError)
  })

  test("tira DomainValidationError si faltan las habilidades opcionales", () => {
    expect(
      () =>
        new Perfil(
          "Tester",
          "Descripción",
          undefined,
          undefined,
          undefined,
          habilidadesRequeridas,
          undefined,
          proyecto,
        ),
    ).toThrow(DomainValidationError)
  })

  test("tira DomainValidationError si falta el proyecto", () => {
    expect(
      () =>
        new Perfil(
          "Tester",
          "Descripción",
          undefined,
          undefined,
          undefined,
          habilidadesRequeridas,
          habilidadesOpcionales,
          undefined,
        ),
    ).toThrow(DomainValidationError)
  })

  test("no tira error si no se especifica una unidad de compromiso (es opcional)", () => {
    expect(
      () =>
        new Perfil(
          "Tester",
          "Descripción",
          null,
          null,
          [],
          habilidadesRequeridas,
          habilidadesOpcionales,
          proyecto,
        ),
    ).not.toThrow()
  })

  test("tira DomainValidationError si la unidad de compromiso es inválida", () => {
    expect(
      () =>
        new Perfil(
          "Tester",
          "Descripción",
          "HORAS_ANUALES",
          5,
          [],
          habilidadesRequeridas,
          habilidadesOpcionales,
          proyecto,
        ),
    ).toThrow(DomainValidationError)
  })
})
