import { describe, expect, test } from "@jest/globals"
import Colectivo from "../../../src/domain/Colectivo"
import TipoColectivo from "../../../src/domain/TipoColectivo"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"

describe("Colectivo", () => {
  test("se construye correctamente con datos válidos", () => {
    const tipoColectivo = new TipoColectivo("Asamblea")
    const colectivo = new Colectivo(
      "Asamblea Ambiental del Sur",
      "Grupo autoconvocado para la protección de la cuenca y humedales locales.",
      tipoColectivo,
      "Argentina",
      "CABA",
      "Almagro",
    )

    expect(colectivo.nombre).toBe("Asamblea Ambiental del Sur")
    expect(colectivo.descripcion).toBe(
      "Grupo autoconvocado para la protección de la cuenca y humedales locales.",
    )
    expect(colectivo.tipo.nombre).toBe("Asamblea")
    expect(colectivo.pais).toBe("Argentina")
    expect(colectivo.provincia).toBe("CABA")
    expect(colectivo.ciudad).toBe("Almagro")
  })
  test("se construye el colectivo sin país, provincia o ciudad", () => {
    const tipoColectivo = new TipoColectivo("Fundación")
    const colectivo = new Colectivo(
      "Fundación EcoFuturo",
      "Organización dedicada al reciclaje e inclusión social.",
      tipoColectivo,
    )

    expect(colectivo.nombre).toBe("Fundación EcoFuturo")
    expect(colectivo.descripcion).toBe(
      "Organización dedicada al reciclaje e inclusión social.",
    )
    expect(colectivo.tipo.nombre).toBe("Fundación")
  })
  test("falta de nombre del colectivo", () => {
    expect(
      () =>
        new Colectivo(
          undefined,
          "Organización dedicada al reciclaje e inclusión social.",
          "ONGs",
        ),
    ).toThrow(DomainValidationError)
  })
  test("falta descripción del colectivo", () => {
    expect(
      () => new Colectivo("Fundacion EcoFuturo", undefined, "ONGs"),
    ).toThrow(DomainValidationError)
  })
  test("falta tipo del colectivo", () => {
    expect(
      () =>
        new Colectivo(
          "Fundacion EcoFuturo",
          "Organización dedicada al reciclaje e inclusión social.",
          undefined,
        ),
    ).toThrow(DomainValidationError)
  })
})
