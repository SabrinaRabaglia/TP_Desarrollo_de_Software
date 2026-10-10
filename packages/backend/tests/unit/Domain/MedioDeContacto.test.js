import { describe, expect, test } from "@jest/globals"
import MedioDeContacto from "../../../src/domain/MedioDeContacto.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"

describe("MedioDeContacto", () => {
  test("se construye correctamente con tipo y valor válidos", () => {
    const medio = new MedioDeContacto("EMAIL", "test@example.com")

    expect(medio.tipo).toBe("EMAIL")
    expect(medio.valor).toBe("test@example.com")
  })

  test("tira DomainValidationError si falta el tipo", () => {
    expect(() => new MedioDeContacto(undefined, "test@example.com")).toThrow(
      DomainValidationError,
    )
  })

  test("tira DomainValidationError si falta el valor", () => {
    expect(() => new MedioDeContacto("EMAIL", "")).toThrow(
      DomainValidationError,
    )
  })

  test("tira DomainValidationError si el formato del email es inválido", () => {
    expect(() => new MedioDeContacto("EMAIL", "correo-sin-arroba")).toThrow(
      DomainValidationError,
    )
  })

  test("tira DomainValidationError si el formato del teléfono de WhatsApp es inválido", () => {
    expect(() => new MedioDeContacto("WHATSAPP", "abc-no-es-telefono")).toThrow(
      DomainValidationError,
    )
  })
})
