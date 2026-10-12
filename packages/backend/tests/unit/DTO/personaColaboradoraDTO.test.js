import { describe, expect, test } from "@jest/globals"
import { personaColaboradoraDTO } from "../../../src/dtos/personaColaboradoraDTO.js"

describe("personaColaboradoraDTO", () => {
  test("expone los datos públicos y nunca los medios de contacto", () => {
    const persona = {
      id: "persona-1",
      nombreFantasia: "anag",
      nombre: "Ana",
      apellido: "Gómez",
      pronombres: ["ella"],
      presentacion: "Desarrolladora frontend",
      cuentas: [{ nombreUsuario: "anagomez", tipo: "GITHUB" }],
      habilidades: [{ id: "habilidad-1", titulo: "React" }],
      aceptaMensajeriaInterna: true,
      mediosDeContacto: [{ tipo: "EMAIL", valor: "ana@example.com" }],
      colaboraciones: [{ id: "colaboracion-1" }],
      createdAt: new Date("2026-09-01T00:00:00.000Z"),
      updatedAt: new Date("2026-09-02T00:00:00.000Z"),
    }

    const dto = personaColaboradoraDTO(persona)

    expect(dto).toEqual({
      id: "persona-1",
      nombreFantasia: "anag",
      nombre: "Ana",
      apellido: "Gómez",
      pronombres: ["ella"],
      presentacion: "Desarrolladora frontend",
      cuentas: [{ nombreUsuario: "anagomez", tipo: "GITHUB" }],
      habilidades: [{ id: "habilidad-1", titulo: "React" }],
      aceptaMensajeriaInterna: true,
      createdAt: persona.createdAt,
      updatedAt: persona.updatedAt,
    })
    expect(dto).not.toHaveProperty("mediosDeContacto")
  })
})
