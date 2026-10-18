import { describe, expect, test } from "@jest/globals"
import Habilidad from "../../../src/domain/Habilidad.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"

describe("Habilidad", () => {
  test("se construye correctamente con datos válidos", () => {
    const habilidad = new Habilidad(
      "Desarrollo Web React",
      "desarrollo_web_react",
      "Desarrollo de interfaces con React",
    )

    expect(habilidad.titulo).toBe("Desarrollo Web React")
    expect(habilidad.codigo).toBe("desarrollo_web_react")
    expect(habilidad.descripcion).toBe("Desarrollo de interfaces con React")
  })

  test("no asigna id: eso corresponde a persistencia", () => {
    const habilidad = new Habilidad("React", "react", "desc")

    expect(habilidad.id).toBeUndefined()
  })

  test("lanza DomainValidationError si falta el título", () => {
    expect(() => new Habilidad(undefined, "react", "desc")).toThrow(
      DomainValidationError,
    )
  })

  test("lanza DomainValidationError si falta el código", () => {
    expect(() => new Habilidad("React", undefined, "desc")).toThrow(
      DomainValidationError,
    )
  })

  test("lanza DomainValidationError si falta la descripción", () => {
    expect(() => new Habilidad("React", "react", undefined)).toThrow(
      DomainValidationError,
    )
  })

  test("lanza DomainValidationError si el título es un string vacío", () => {
    expect(() => new Habilidad("", "react", "desc")).toThrow(
      DomainValidationError,
    )
  })
})
