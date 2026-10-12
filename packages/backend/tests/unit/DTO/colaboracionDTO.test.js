import { describe, expect, test } from "@jest/globals"
import { colaboracionDTO } from "../../../src/dtos/colaboracionDTO.js"

const crearColaboracion = (esAnonima) => ({
  id: "colaboracion-1",
  fechaInscripcion: new Date("2026-09-12T00:00:00.000Z"),
  esAnonima,
  personaColaboradora: { id: "persona-1", nombreFantasia: "anag" },
  proyecto: { id: "proyecto-1", titulo: "Sitio web de la huerta" },
  createdAt: new Date("2026-09-12T00:00:00.000Z"),
  updatedAt: new Date("2026-09-12T00:00:00.000Z"),
})

describe("colaboracionDTO", () => {
  test("una colaboración pública muestra quién la realizó", () => {
    const colaboracion = crearColaboracion(false)

    expect(colaboracionDTO(colaboracion)).toEqual(colaboracion)
  })

  test("una colaboración anónima figura igual pero sin indicar quién la realizó", () => {
    const colaboracion = crearColaboracion(true)

    expect(colaboracionDTO(colaboracion)).toEqual({
      ...colaboracion,
      personaColaboradora: null,
    })
  })
})
