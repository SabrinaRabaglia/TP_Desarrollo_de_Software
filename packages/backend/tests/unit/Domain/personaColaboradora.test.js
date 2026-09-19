import { describe, expect, test } from "@jest/globals"
import PersonaColaboradora from "../../../src/domain/PersonaColaboradora.js"
import Habilidad from "../../../src/domain/Habilidad.js"
import Cuenta from "../../../src/domain/Cuenta.js"
import { TipoCuenta } from "../../../src/domain/enums/TipoCuenta.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"

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
    expect(persona.colaboraciones).toEqual([])
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

    const persona = new PersonaColaboradora(
      "anon123",
      nombre,
      apellido,
      pronombres,
      presentacion,
      cuentas,
      habilidades,
    )

    expect(persona.nombre).toBe("Juan")
    expect(persona.apellido).toBe("Pedro")
    expect(persona.pronombres).toEqual(["el", "elle"])
    expect(persona.presentacion).toBe("Desarrollador frontend")
    expect(persona.cuentas).toEqual([cuenta])
    expect(persona.habilidades).toEqual([habilidad])
  })

  test("no asigna id: eso corresponde a persistencia", () => {
    const persona = new PersonaColaboradora("anon1")

    expect(persona.id).toBeUndefined()
  })

  test("tira DomainValidationError si falta nombreFantasia", () => {
    const construirPersonaSinNombreFantasia = () =>
      new PersonaColaboradora(undefined)

    expect(construirPersonaSinNombreFantasia).toThrow(DomainValidationError)
  })

  test("tira DomainValidationError si nombreFantasia es un string vacío", () => {
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

  test("agregarColaboracion agrega una colaboración al array existente", () => {
    const persona = new PersonaColaboradora("anon123")
    const colaboracionFalsa = { proyecto: "algún proyecto" }
    persona.agregarColaboracion(colaboracionFalsa)

    expect(persona.colaboraciones).toEqual([colaboracionFalsa])
  })
})
