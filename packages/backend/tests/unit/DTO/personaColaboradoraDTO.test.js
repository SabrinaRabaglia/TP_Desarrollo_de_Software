import { describe, expect, test } from "@jest/globals"
import { personaColaboradoraDTO } from "../../../src/dtos/personaColaboradoraDTO.js"

describe("personaColaboradoraDTO", () => {
  test("expone identificadores y tipos de contacto, pero nunca sus valores", () => {
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
      mediosDeContacto: [
        { id: "contacto-1", tipo: "EMAIL", valor: "ana@example.com" },
      ],
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
      mediosDeContacto: [{ id: "contacto-1", tipo: "EMAIL" }],
      createdAt: persona.createdAt,
      updatedAt: persona.updatedAt,
    })
    expect(dto.mediosDeContacto[0]).not.toHaveProperty("valor")
  })
})
