import { describe, expect, test } from "@jest/globals"
import { notificacionDTO } from "../../../src/dtos/notificacionDTO.js"

describe("notificacionDTO", () => {
  test("expone el tipo de los medios externos y nunca sus valores", () => {
    const notificacion = {
      id: "notificacion-1",
      fecha: new Date("2026-10-01T00:00:00.000Z"),
      contenido: "Hola",
      colectivo: "colectivo-1",
      personaColaboradora: "persona-1",
      perfil: "perfil-1",
      mediosExternosUtilizados: [
        { tipo: "EMAIL", valor: "ana@example.com" },
        { tipo: "SMS", valor: "+54 9 11 2345-6789" },
      ],
      createdAt: new Date("2026-10-01T00:00:00.000Z"),
      updatedAt: new Date("2026-10-01T00:00:00.000Z"),
    }

    expect(notificacionDTO(notificacion)).toEqual({
      ...notificacion,
      mediosExternosUtilizados: ["EMAIL", "SMS"],
    })
  })
})
