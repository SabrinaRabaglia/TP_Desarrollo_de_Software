import { describe, expect, test } from "@jest/globals"
import MedioDeContacto from "../../../src/domain/MedioDeContacto.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"

describe("MedioDeContacto", () => {
  test("se construye correctamente con tipo y valor válidos", () => {
    const medio = new MedioDeContacto("EMAIL", "test@example.com")

    expect(medio.tipo).toBe("EMAIL")
    expect(medio.valor).toBe("test@example.com")
  })

  test("lanza DomainValidationError si falta el tipo", () => {
    expect(() => new MedioDeContacto(undefined, "test@example.com")).toThrow(
      DomainValidationError,
    )
  })

  test("lanza DomainValidationError si el tipo no es EMAIL, WHATSAPP ni SMS", () => {
    expect(() => new MedioDeContacto("TELEGRAM", "@ana")).toThrow(
      DomainValidationError,
    )
  })

  test("lanza DomainValidationError si falta el valor", () => {
    expect(() => new MedioDeContacto("EMAIL", "")).toThrow(
      DomainValidationError,
    )
  })

  test("lanza DomainValidationError si el formato del email es inválido", () => {
    expect(() => new MedioDeContacto("EMAIL", "correo-sin-arroba")).toThrow(
      DomainValidationError,
    )
  })

  test("lanza DomainValidationError si el formato del teléfono de WhatsApp es inválido", () => {
    expect(() => new MedioDeContacto("WHATSAPP", "abc-no-es-telefono")).toThrow(
      DomainValidationError,
    )
  })

  test.each([
    "+54 9 11 1234-5678",
    "+54 11 1234-5678",
    "+54 351 123-4567",
    "(011) 4567-8901",
    "11.1234.5678",
    "+5491112345678",
  ])("acepta el teléfono %s", (telefono) => {
    expect(new MedioDeContacto("SMS", telefono).valor).toBe(telefono)
  })

  test.each(["1234567", "+54 9 11 1234-5678 999", "11 1234 56a8", "+"])(
    "rechaza el teléfono %s",
    (telefono) => {
      expect(() => new MedioDeContacto("SMS", telefono)).toThrow(
        DomainValidationError,
      )
    },
  )
})
