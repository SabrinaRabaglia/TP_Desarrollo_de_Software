import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import PersonaColaboradoraService from "../../../src/services/PersonaColaboradoraService.js"
import PersonaColaboradoraRepository from "../../fakes/PersonaColaboradoraRepository.js"
import PersonaColaboradora from "../../../src/domain/PersonaColaboradora.js"
import Cuenta from "../../../src/domain/Cuenta.js"
import Habilidad from "../../../src/domain/Habilidad.js"
import { EntityNotFound, InvalidReference } from "../../../src/errors/ApplicationErrors.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"

describe("PersonaColaboradoraService", () => {
  let repository
  let service
  let habilidad
  let datos

  beforeEach(() => {
    repository = new PersonaColaboradoraRepository()
    repository.deleteAll() // Limpiamos la memoria estática antes de cada test
    
    habilidad = new Habilidad("React", "react", "Desarrollo web")
    habilidad.id = "habilidad-1"
    const habilidadService = {
      getById: jest.fn(async (id) => {
        if (id !== habilidad.id) {
          throw new EntityNotFound("Habilidad no encontrada")
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

  test("crea y guarda una persona con cuentas y habilidades resueltas", async () => {
    const persona = await service.create(datos)

    expect(persona).toBeInstanceOf(PersonaColaboradora)
    expect(persona.nombreFantasia).toBe(datos.nombreFantasia)
    expect(persona.cuentas[0]).toBeInstanceOf(Cuenta)
    expect(persona.cuentas).toEqual(datos.cuentas)
    expect(persona.habilidades).toEqual([habilidad])
    expect(await repository.getAll()).toEqual([persona])
  })

  test("rechaza una habilidad inexistente sin guardar la persona", async () => {
    await expect(
      service.create({
        ...datos,
        habilidades: [habilidad.id, "habilidad-inexistente"],
      }),
    ).rejects.toThrow(InvalidReference)

    expect(await repository.getAll()).toEqual([])
  })

  test("actualiza los datos, cuentas y habilidades conservando la identidad", async () => {
    const persona = await service.create({ nombreFantasia: "Original" })
    const id = persona.id

    const actualizada = await service.update(id, datos)

    expect(actualizada.id).toBe(id)
    expect(actualizada.nombreFantasia).toBe(datos.nombreFantasia)
    expect(actualizada.nombre).toBe(datos.nombre)
    expect(actualizada.cuentas[0]).toBeInstanceOf(Cuenta)
    expect(actualizada.cuentas).toEqual(datos.cuentas)
    expect(actualizada.habilidades).toEqual([habilidad])
    expect(await repository.findById(id)).toBe(actualizada)
    expect(await repository.getAll()).toHaveLength(1)
  })

  test("una actualización rechazada deja intactos los datos guardados", async () => {
    const persona = await service.create(datos)
    const antes = { ...persona }

    await expect(
      service.update(persona.id, {
        nombreFantasia: "No debe guardarse",
        habilidades: ["habilidad-inexistente"],
      }),
    ).rejects.toThrow(InvalidReference)

    expect(await repository.findById(persona.id)).toEqual(antes)
  })

  test("rechaza un nombre de fantasía vacío sin modificar la persona", async () => {
    const persona = await service.create(datos)
    const antes = { ...persona }

    await expect(
      service.update(persona.id, {
        ...datos,
        nombreFantasia: "",
        presentacion: "No debe guardarse",
      }),
    ).rejects.toThrow(DomainValidationError)

    expect(await repository.findById(persona.id)).toEqual(antes)
  })
})