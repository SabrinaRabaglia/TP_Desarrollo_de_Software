import { describe, expect, test, beforeEach } from "@jest/globals"
import PersonaColaboradoraRepository from "../../../src/repositories/PersonaColaboradoraRepository.js"

describe("PersonaColaboradoraRepository", () => {
  let repository

  beforeEach(async () => {
    repository = new PersonaColaboradoraRepository()
    await repository.deleteAll()
  })

  test("getAll devuelve un array vacío si no se guardó nada", async () => {
    const repository = new PersonaColaboradoraRepository()
    const personas = await repository.getAll()

    expect(personas).toEqual([])
  })

  test("save agrega una persona nueva si su id no existe todavía", async () => {
    const repository = new PersonaColaboradoraRepository()
    const persona = { id: "1", nombreFantasia: "anon1" }
    const guardada = await repository.save(persona)

    expect(guardada).toBe(persona)
    expect(await repository.getAll()).toEqual([persona])
  })

  test("save pisa la persona existente si el id ya está guardado (upsert)", async () => {
    const repository = new PersonaColaboradoraRepository()
    const personaOriginal = { id: "1", nombreFantasia: "anon1" }
    await repository.save(personaOriginal)
    const personaActualizada = { id: "1", nombreFantasia: "anon1-editado" }
    await repository.save(personaActualizada)

    expect(await repository.getAll()).toHaveLength(1)
    expect((await repository.getAll())[0].nombreFantasia).toBe("anon1-editado")
  })

  test("findById encuentra la persona correcta por id", async () => {
    const repository = new PersonaColaboradoraRepository()
    const persona1 = { id: "1", nombreFantasia: "anon1" }
    const persona2 = { id: "2", nombreFantasia: "anon2" }
    await repository.save(persona1)
    await repository.save(persona2)
    const encontrada = await repository.findById("2")

    expect(encontrada).toBe(persona2)
  })

  test("findById devuelve undefined si no existe ninguna con ese id", async () => {
    const repository = new PersonaColaboradoraRepository()
    const encontrada = await repository.findById("id-inexistente")

    expect(encontrada).toBeUndefined()
  })

  test("deleteById borra la persona y devuelve true", async () => {
    const repository = new PersonaColaboradoraRepository()
    const persona = { id: "1", nombreFantasia: "anon1" }
    await repository.save(persona)
    const resultado = await repository.deleteById("1")

    expect(resultado).toBe(true)
    expect(await repository.getAll()).toEqual([])
  })

  test("deleteById devuelve false si el id no existe, sin modificar la colección", async () => {
    const repository = new PersonaColaboradoraRepository()
    const persona = { id: "1", nombreFantasia: "anon1" }
    await repository.save(persona)
    const resultado = await repository.deleteById("id-inexistente")

    expect(resultado).toBe(false)
    expect(await repository.getAll()).toEqual([persona])
  })
})
