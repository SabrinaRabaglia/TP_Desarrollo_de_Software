import { describe, expect, test } from "@jest/globals"
import Habilidad from "../../src/domain/Habilidad.js"
import { UnprocessableEntityError } from "../../src/errors/AppError.js"

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

  test("genera un id único por instancia", () => {
    const habilidad1 = new Habilidad("React", "react", "desc")
    const habilidad2 = new Habilidad("Node", "node", "desc")

    expect(habilidad1.id).toBeDefined()
    expect(habilidad2.id).toBeDefined()
    expect(habilidad1.id).not.toBe(habilidad2.id)
  })

  test("tira UnprocessableEntityError si falta el título", () => {
    expect(() => new Habilidad(undefined, "react", "desc")).toThrow(
      UnprocessableEntityError,
    )
  })

  test("tira UnprocessableEntityError si falta el código", () => {
    expect(() => new Habilidad("React", undefined, "desc")).toThrow(
      UnprocessableEntityError,
    )
  })

  test("tira UnprocessableEntityError si falta la descripción", () => {
    expect(() => new Habilidad("React", "react", undefined)).toThrow(
      UnprocessableEntityError,
    )
  })

  test("tira UnprocessableEntityError si el título es un string vacío", () => {
    expect(() => new Habilidad("", "react", "desc")).toThrow(
      UnprocessableEntityError,
    )
  })
})
