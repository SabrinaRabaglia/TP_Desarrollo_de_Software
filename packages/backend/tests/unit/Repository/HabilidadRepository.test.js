import { describe, expect, test } from "@jest/globals"
import HabilidadRepository from "../../../src/repositories/HabilidadRepository.js"

describe("HabilidadRepository", () => {
  test("getAll devuelve un array vacío si no se guardó nada", () => {
    const repository = new HabilidadRepository()
    const habilidades = repository.getAll()

    expect(habilidades).toEqual([])
  })

  test("save agrega una habilidad nueva si su id no existe todavía", () => {
    const repository = new HabilidadRepository()
    const habilidad = { id: "1", codigo: "react", titulo: "React" }
    const guardada = repository.save(habilidad)

    expect(guardada).toBe(habilidad)
    expect(repository.getAll()).toEqual([habilidad])
  })

  test("save pisa la habilidad existente si el id ya está guardado (upsert)", () => {
    const repository = new HabilidadRepository()
    const habilidadOriginal = { id: "1", codigo: "react", titulo: "React" }
    repository.save(habilidadOriginal)
    const habilidadActualizada = {
      id: "1",
      codigo: "react",
      titulo: "React actualizado",
    }
    repository.save(habilidadActualizada)

    expect(repository.getAll()).toHaveLength(1)
    expect(repository.getAll()[0].titulo).toBe("React actualizado")
  })

  test("findById encuentra la habilidad correcta por id", () => {
    const repository = new HabilidadRepository()
    const habilidad1 = { id: "1", codigo: "react" }
    const habilidad2 = { id: "2", codigo: "node" }
    repository.save(habilidad1)
    repository.save(habilidad2)
    const encontrada = repository.findById("2")

    expect(encontrada).toBe(habilidad2)
  })

  test("findById devuelve undefined si no existe ninguna con ese id", () => {
    const repository = new HabilidadRepository()
    const encontrada = repository.findById("id-inexistente")

    expect(encontrada).toBeUndefined()
  })

  test("findByCodigo encuentra la habilidad correcta por código", () => {
    const repository = new HabilidadRepository()
    const habilidad = { id: "1", codigo: "react" }
    repository.save(habilidad)
    const encontrada = repository.findByCodigo("react")

    expect(encontrada).toBe(habilidad)
  })

  test("findByCodigo devuelve undefined si no existe ninguna con ese código", () => {
    const repository = new HabilidadRepository()
    const encontrada = repository.findByCodigo("no-existe")

    expect(encontrada).toBeUndefined()
  })

  test("deleteById borra la habilidad y devuelve true", () => {
    const repository = new HabilidadRepository()
    const habilidad = { id: "1", codigo: "react" }
    repository.save(habilidad)
    const resultado = repository.deleteById("1")

    expect(resultado).toBe(true)
    expect(repository.getAll()).toEqual([])
  })

  test("deleteById devuelve false si el id no existe, sin modificar la colección", () => {
    const repository = new HabilidadRepository()
    const habilidad = { id: "1", codigo: "react" }
    repository.save(habilidad)
    const resultado = repository.deleteById("id-inexistente")

    expect(resultado).toBe(false)
    expect(repository.getAll()).toEqual([habilidad])
  })
})
