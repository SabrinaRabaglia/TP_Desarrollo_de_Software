import { describe, expect, test } from "@jest/globals"
import Cuenta from "../../../src/domain/Cuenta.js"
import { TipoCuenta } from "../../../src/domain/enums/TipoCuenta.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"

describe("Cuenta", () => {
  test("se construye correctamente con un tipo válido (GITHUB)", () => {
    const nombreUsuario = "juanpedro"
    const tipo = TipoCuenta.GITHUB
    const cuenta = new Cuenta(nombreUsuario, tipo)

    expect(cuenta.nombreUsuario).toBe(nombreUsuario)
    expect(cuenta.tipo).toBe("GITHUB")
  })

  test("se construye correctamente con un tipo válido (GITLAB)", () => {
    const tipo = TipoCuenta.GITLAB
    const cuenta = new Cuenta("juanpedro", tipo)

    expect(cuenta.tipo).toBe("GITLAB")
  })

  test("lanza DomainValidationError si falta el nombre de usuario", () => {
    const construirCuentaSinNombreUsuario = () =>
      new Cuenta(undefined, TipoCuenta.GITHUB)

    expect(construirCuentaSinNombreUsuario).toThrow(DomainValidationError)
  })

  test("lanza DomainValidationError si el tipo no es GITHUB ni GITLAB", () => {
    const construirCuentaConTipoInvalido = () =>
      new Cuenta("juanpedro", "MASTODON")

    expect(construirCuentaConTipoInvalido).toThrow(DomainValidationError)
  })

  test("lanza DomainValidationError si no se indica ningún tipo", () => {
    const construirCuentaSinTipo = () => new Cuenta("juanpedro", undefined)

    expect(construirCuentaSinTipo).toThrow(DomainValidationError)
  })
})
