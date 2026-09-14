import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import PersonaColaboradoraService from "../../../src/services/PersonaColaboradoraService.js"
import PersonaColaboradoraRepository from "../../../src/repositories/PersonaColaboradoraRepository.js"
import PersonaColaboradora from "../../../src/domain/PersonaColaboradora.js"
import Cuenta from "../../../src/domain/Cuenta.js"
import Habilidad from "../../../src/domain/Habilidad.js"
import {
  NotFoundError,
  UnprocessableEntityError,
} from "../../../src/errors/AppError.js"

describe("PersonaColaboradoraService", () => {
  let repository
  let service
  let habilidad
  let datos

  beforeEach(() => {
    repository = new PersonaColaboradoraRepository()
    habilidad = new Habilidad("React", "react", "Desarrollo web")
    const habilidadService = {
      getById: jest.fn((id) => {
        if (id !== habilidad.id) {
          throw new NotFoundError("Habilidad no encontrada")
        }
        return habilidad
      }),
    }
    service = new PersonaColaboradoraService(repository, habilidadService)
    datos = {
      nombreFantasia: "anon123",
      nombre: "Ana",
      cuentas: [{ nombreUsuario: "anagomez", tipo: "GITHUB" }],
      habilidades: [habilidad.id],
    }
  })

  test("crea y guarda una persona con cuentas y habilidades resueltas", () => {
    const persona = service.create(datos)

    expect(persona).toBeInstanceOf(PersonaColaboradora)
    expect(persona.nombreFantasia).toBe(datos.nombreFantasia)
    expect(persona.cuentas[0]).toBeInstanceOf(Cuenta)
    expect(persona.cuentas).toEqual(datos.cuentas)
    expect(persona.habilidades).toEqual([habilidad])
    expect(repository.getAll()).toEqual([persona])
  })

  test("rechaza una habilidad inexistente sin guardar la persona", () => {
    expect(() =>
      service.create({
        ...datos,
        habilidades: [habilidad.id, "habilidad-inexistente"],
      }),
    ).toThrow(NotFoundError)

    expect(repository.getAll()).toEqual([])
  })

  test("actualiza los datos, cuentas y habilidades conservando la identidad", () => {
    const persona = service.create({ nombreFantasia: "Original" })
    const id = persona.id

    const actualizada = service.update(id, datos)

    expect(actualizada.id).toBe(id)
    expect(actualizada.nombreFantasia).toBe(datos.nombreFantasia)
    expect(actualizada.nombre).toBe(datos.nombre)
    expect(actualizada.cuentas[0]).toBeInstanceOf(Cuenta)
    expect(actualizada.cuentas).toEqual(datos.cuentas)
    expect(actualizada.habilidades).toEqual([habilidad])
    expect(repository.findById(id)).toBe(actualizada)
    expect(repository.getAll()).toHaveLength(1)
  })

  test("una actualización rechazada deja intactos los datos guardados", () => {
    const persona = service.create(datos)
    const antes = structuredClone(persona)

    expect(() =>
      service.update(persona.id, {
        nombreFantasia: "No debe guardarse",
        habilidades: ["habilidad-inexistente"],
      }),
    ).toThrow(NotFoundError)

    expect(repository.findById(persona.id)).toEqual(antes)
  })

  test("rechaza un nombre de fantasía vacío sin modificar la persona", () => {
    const persona = service.create(datos)
    const antes = structuredClone(persona)

    expect(() =>
      service.update(persona.id, {
        ...datos,
        nombreFantasia: "",
        presentacion: "No debe guardarse",
      }),
    ).toThrow(UnprocessableEntityError)

    expect(repository.findById(persona.id)).toEqual(antes)
  })
})
