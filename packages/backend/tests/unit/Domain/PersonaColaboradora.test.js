import { describe, expect, test } from "@jest/globals"
import PersonaColaboradora from "../../../src/domain/PersonaColaboradora.js"
import Habilidad from "../../../src/domain/Habilidad.js"
import Cuenta from "../../../src/domain/Cuenta.js"
import { TipoCuenta } from "../../../src/domain/enums/TipoCuenta.js"
import {
  DomainRuleError,
  DomainValidationError,
} from "../../../src/domain/errors/DomainErrors.js"

describe("PersonaColaboradora", () => {
  test("se construye solo con nombreFantasia, con el resto en sus valores por defecto", () => {
    const nombreFantasia = "anon123"
    const persona = new PersonaColaboradora(nombreFantasia)

    expect(persona.nombreFantasia).toBe(nombreFantasia)
    expect(persona.nombre).toBeNull()
    expect(persona.apellido).toBeNull()
    expect(persona.pronombres).toEqual([])
    expect(persona.presentacion).toBeNull()
    expect(persona.cuentas).toEqual([])
    expect(persona.habilidades).toEqual([])
    expect(persona.aceptaMensajeriaInterna).toBe(false)
    expect(persona.mediosDeContacto).toEqual([])
  })

  test("se construye con todos los datos opcionales cuando se los pasan", () => {
    const habilidad = new Habilidad("React", "react", "desc")
    const cuenta = new Cuenta("juanpedro", TipoCuenta.GITHUB)
    const nombre = "Juan"
    const apellido = "Pedro"
    const pronombres = ["el", "elle"]
    const presentacion = "Desarrollador frontend"
    const cuentas = [cuenta]
    const habilidades = [habilidad]
    const aceptaMensajeriaInterna = true
    const mediosDeContacto = [{ tipo: "EMAIL", valor: "juan@example.com" }]

    const persona = new PersonaColaboradora(
      "anon123",
      nombre,
      apellido,
      pronombres,
      presentacion,
      cuentas,
      habilidades,
      aceptaMensajeriaInterna,
      mediosDeContacto,
    )

    expect(persona.nombre).toBe("Juan")
    expect(persona.apellido).toBe("Pedro")
    expect(persona.pronombres).toEqual(["el", "elle"])
    expect(persona.presentacion).toBe("Desarrollador frontend")
    expect(persona.cuentas).toEqual([cuenta])
    expect(persona.habilidades).toEqual([habilidad])
    expect(persona.aceptaMensajeriaInterna).toBe(true)
    expect(persona.mediosDeContacto).toEqual(mediosDeContacto)
  })

  test("no asigna id: eso corresponde a persistencia", () => {
    const persona = new PersonaColaboradora("anon1")

    expect(persona.id).toBeUndefined()
  })

  test("lanza DomainValidationError si falta nombreFantasia", () => {
    const construirPersonaSinNombreFantasia = () =>
      new PersonaColaboradora(undefined)

    expect(construirPersonaSinNombreFantasia).toThrow(DomainValidationError)
  })

  test("lanza DomainValidationError si nombreFantasia es un string vacío", () => {
    const construirPersonaConNombreFantasiaVacio = () =>
      new PersonaColaboradora("")

    expect(construirPersonaConNombreFantasiaVacio).toThrow(
      DomainValidationError,
    )
  })

  test("agregarHabilidad agrega una habilidad al array existente", () => {
    const persona = new PersonaColaboradora("anon123")
    const habilidad = new Habilidad("React", "react", "desc")
    persona.agregarHabilidad(habilidad)

    expect(persona.habilidades).toEqual([habilidad])
  })

  test("agregarCuenta agrega una cuenta al array existente", () => {
    const persona = new PersonaColaboradora("anon123")
    const cuenta = new Cuenta("anagomez", TipoCuenta.GITHUB)
    persona.agregarCuenta(cuenta)

    expect(persona.cuentas).toEqual([cuenta])
  })

  test("solo se puede contactar por mensajería interna si lo aceptó", () => {
    const acepta = new PersonaColaboradora("anag")
    acepta.aceptaMensajeriaInterna = true

    expect(() => acepta.assertAceptaMensajeriaInterna()).not.toThrow()
    expect(() =>
      new PersonaColaboradora("anon123").assertAceptaMensajeriaInterna(),
    ).toThrow(DomainRuleError)
  })
})
