import { describe, expect, test, beforeEach } from "@jest/globals"
import HabilidadRepository from "../../../src/repositories/HabilidadRepository.js"

describe("HabilidadRepository", () => {
  let repository

  beforeEach(async () => {
    repository = new HabilidadRepository()
    await repository.deleteAll()
  })

  test("getAll devuelve un array vacío si no se guardó nada", async () => {
    const repository = new HabilidadRepository()
    const habilidades = await repository.getAll()

    expect(habilidades).toEqual([])
  })

  test("save agrega una habilidad nueva si su id no existe todavía", async () => {
    const repository = new HabilidadRepository()
    const habilidad = { id: "1", codigo: "react", titulo: "React" }
    const guardada = await repository.save(habilidad)

    expect(guardada).toBe(habilidad)
    expect(await repository.getAll()).toEqual([habilidad])
  })

  test("save pisa la habilidad existente si el id ya está guardado (upsert)", async () => {
    const repository = new HabilidadRepository()
    const habilidadOriginal = { id: "1", codigo: "react", titulo: "React" }
    await repository.save(habilidadOriginal)
    const habilidadActualizada = {
      id: "1",
      codigo: "react",
      titulo: "React actualizado",
    }
    await repository.save(habilidadActualizada)

    expect(await repository.getAll()).toHaveLength(1)
    expect((await repository.getAll())[0].titulo).toBe("React actualizado")
  })

  test("findById encuentra la habilidad correcta por id", async () => {
    const repository = new HabilidadRepository()
    const habilidad1 = { id: "1", codigo: "react" }
    const habilidad2 = { id: "2", codigo: "node" }
    await repository.save(habilidad1)
    await repository.save(habilidad2)
    const encontrada = await repository.findById("2")

    expect(encontrada).toBe(habilidad2)
  })

  test("findById devuelve undefined si no existe ninguna con ese id", async () => {
    const repository = new HabilidadRepository()
    const encontrada = await repository.findById("id-inexistente")

    expect(encontrada).toBeUndefined()
  })

  test("findByCodigo encuentra la habilidad correcta por código", async () => {
    const repository = new HabilidadRepository()
    const habilidad = { id: "1", codigo: "react" }
    await repository.save(habilidad)
    const encontrada = await repository.findByCodigo("react")

    expect(encontrada).toBe(habilidad)
  })

  test("findByCodigo devuelve undefined si no existe ninguna con ese código", async () => {
    const repository = new HabilidadRepository()
    const encontrada = await repository.findByCodigo("no-existe")

    expect(encontrada).toBeUndefined()
  })

  test("deleteById borra la habilidad y devuelve true", async () => {
    const repository = new HabilidadRepository()
    const habilidad = { id: "1", codigo: "react" }
    await repository.save(habilidad)
    const resultado = await repository.deleteById("1")

    expect(resultado).toBe(true)
    expect(await repository.getAll()).toEqual([])
  })

  test("deleteById devuelve false si el id no existe, sin modificar la colección", async () => {
    const repository = new HabilidadRepository()
    const habilidad = { id: "1", codigo: "react" }
    await repository.save(habilidad)
    const resultado = await repository.deleteById("id-inexistente")

    expect(resultado).toBe(false)
    expect(await repository.getAll()).toEqual([habilidad])
  })
})
