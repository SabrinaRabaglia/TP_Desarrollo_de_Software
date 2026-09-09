import { describe, expect, test } from "@jest/globals"
import PersonaColaboradoraRepository from "../../src/repositories/PersonaColaboradoraRepository.js"

describe("PersonaColaboradoraRepository", () => {
  test("getAll devuelve un array vacío si no se guardó nada", () => {
    const repository = new PersonaColaboradoraRepository()
    const personas = repository.getAll()

    expect(personas).toEqual([])
  })

  test("save agrega una persona nueva si su id no existe todavía", () => {
    const repository = new PersonaColaboradoraRepository()
    const persona = { id: "1", nombreFantasia: "anon1" }
    const guardada = repository.save(persona)

    expect(guardada).toBe(persona)
    expect(repository.getAll()).toEqual([persona])
  })

  test("save pisa la persona existente si el id ya está guardado (upsert)", () => {
    const repository = new PersonaColaboradoraRepository()
    const personaOriginal = { id: "1", nombreFantasia: "anon1" }
    repository.save(personaOriginal)
    const personaActualizada = { id: "1", nombreFantasia: "anon1-editado" }
    repository.save(personaActualizada)

    expect(repository.getAll()).toHaveLength(1)
    expect(repository.getAll()[0].nombreFantasia).toBe("anon1-editado")
  })

  test("findById encuentra la persona correcta por id", () => {
    const repository = new PersonaColaboradoraRepository()
    const persona1 = { id: "1", nombreFantasia: "anon1" }
    const persona2 = { id: "2", nombreFantasia: "anon2" }
    repository.save(persona1)
    repository.save(persona2)
    const encontrada = repository.findById("2")

    expect(encontrada).toBe(persona2)
  })

  test("findById devuelve undefined si no existe ninguna con ese id", () => {
    const repository = new PersonaColaboradoraRepository()
    const encontrada = repository.findById("id-inexistente")

    expect(encontrada).toBeUndefined()
  })

  test("deleteById borra la persona y devuelve true", () => {
    const repository = new PersonaColaboradoraRepository()
    const persona = { id: "1", nombreFantasia: "anon1" }
    repository.save(persona)
    const resultado = repository.deleteById("1")

    expect(resultado).toBe(true)
    expect(repository.getAll()).toEqual([])
  })

  test("deleteById devuelve false si el id no existe, sin modificar la colección", () => {
    const repository = new PersonaColaboradoraRepository()
    const persona = { id: "1", nombreFantasia: "anon1" }
    repository.save(persona)
    const resultado = repository.deleteById("id-inexistente")

    expect(resultado).toBe(false)
    expect(repository.getAll()).toEqual([persona])
  })
})