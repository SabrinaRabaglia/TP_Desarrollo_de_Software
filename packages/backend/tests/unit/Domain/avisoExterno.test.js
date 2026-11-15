import { describe, expect, test } from "@jest/globals"
import { redactarAvisoExterno } from "../../../src/domain/avisoExterno.js"

const completo = {
  colectivo: "Red Solidaria Sur",
  proyecto: "Mapa de comedores comunitarios",
  perfil: "Tester",
  contenido: "Hola, ¿te sumás?",
  urlDeLaPlataforma: "https://ejemplo",
}

describe("redactarAvisoExterno", () => {
  test("dice quién escribe, por qué perfil, el mensaje y cómo responder", () => {
    expect(redactarAvisoExterno(completo)).toBe(
      'Red Solidaria Sur te escribió por el perfil Tester de "Mapa de comedores comunitarios":\n\n' +
        "Hola, ¿te sumás?\n\n" +
        "Este es un aviso automático de Código a Voluntad. Para responder entrá a la plataforma: https://ejemplo/mensajes",
    )
  })

  test("sin URL de la plataforma la última oración termina sin enlace", () => {
    const aviso = redactarAvisoExterno({
      ...completo,
      urlDeLaPlataforma: undefined,
    })

    expect(aviso.endsWith("Para responder entrá a la plataforma.")).toBe(true)
  })

  test.each([
    [
      "sin colectivo",
      { colectivo: null },
      'Un colectivo te escribió por el perfil Tester de "Mapa de comedores comunitarios":',
    ],
    [
      "sin perfil",
      { perfil: null },
      'Red Solidaria Sur te escribió por el proyecto "Mapa de comedores comunitarios":',
    ],
    [
      "sin proyecto ni perfil",
      { proyecto: null, perfil: null },
      "Red Solidaria Sur te escribió en Código a Voluntad:",
    ],
    [
      "sin nada",
      { colectivo: null, proyecto: null, perfil: null },
      "Un colectivo te escribió en Código a Voluntad:",
    ],
  ])(
    "%s el encabezado degrada sin imprimir null",
    (_caso, faltantes, encabezado) => {
      const aviso = redactarAvisoExterno({ ...completo, ...faltantes })

      expect(aviso.split("\n")[0]).toBe(encabezado)
      expect(aviso).toContain("Hola, ¿te sumás?")
      expect(aviso).not.toMatch(/null|undefined/)
    },
  )
})
