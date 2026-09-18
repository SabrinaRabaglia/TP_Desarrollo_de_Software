import { describe, expect, test, beforeEach} from "@jest/globals"
import ColectivoRepository from "../../../src/repositories/ColectivoRepository.js"

describe("ColectivoRepository", () => {
  let repository

  beforeEach(async () => {
    repository = new ColectivoRepository()
    await repository.deleteAll()
  })

  test("findAll devuelve un array vacío si no se guardó nada", async () => {
    const repository = new ColectivoRepository()
    const colectivos = await repository.findAll()

    expect(colectivos).toEqual([])
  })

  test("save agrega un colectivo nuevo si su id no existe todavía", async () => {
    const repository = new ColectivoRepository()
    const colectivo = {
      id: "1",
      nombre: "Asamblea Ambiental",
      tipo: "asamblea",
    }
    const guardado = await repository.save(colectivo)

    expect(guardado).toBe(colectivo)
    expect(await repository.findAll()).toEqual([colectivo])
  })

  test("save pisa el colectivo existente si el id ya está guardado (upsert)", async () => {
    const repository = new ColectivoRepository()
    const colectivoOriginal = {
      id: "1",
      nombre: "Asamblea Ambiental",
      tipo: "asamblea",
    }
    await repository.save(colectivoOriginal)
    const colectivoActualizado = {
      id: "1",
      nombre: "Asamblea Ambiental del Sur",
      tipo: "asamblea",
    }
    await repository.save(colectivoActualizado)

    expect(await repository.findAll()).toHaveLength(1)
    expect((await repository.findAll())[0].nombre).toBe("Asamblea Ambiental del Sur")
  })

  test("findById encuentra el colectivo correcto por id", async () => {
    const repository = new ColectivoRepository()
    const colectivo1 = { id: "1", nombre: "Asamblea Ambiental" }
    const colectivo2 = { id: "2", nombre: "Colectivo Comunitario" }
    await repository.save(colectivo1)
    await repository.save(colectivo2)
    const encontrado = await repository.findById("2")

    expect(encontrado).toBe(colectivo2)
  })

  test("findById devuelve undefined si no existe ninguno con ese id", async () => {
    const repository = new ColectivoRepository()
    const encontrado = await repository.findById("id-inexistente")

    expect(encontrado).toBeUndefined()
  })

  test("findByNombre encuentra el colectivo correcto por nombre", async () => {
    const repository = new ColectivoRepository()
    const colectivo = { id: "1", nombre: "Asamblea Ambiental" }
    await repository.save(colectivo)
    const encontrado = await repository.findByNombre("Asamblea Ambiental")

    expect(encontrado).toBe(colectivo)
  })

  test("findByNombre devuelve undefined si no existe ninguno con ese nombre", async () => {
    const repository = new ColectivoRepository()
    const encontrado = await repository.findByNombre("no-existe")

    expect(encontrado).toBeUndefined()
  })

  test("delete borra el colectivo de la colección", async () => {
    const repository = new ColectivoRepository()
    const colectivo = { id: "1", nombre: "Asamblea Ambiental" }
    await repository.save(colectivo)
    await repository.delete("1")

    expect(await repository.findAll()).toEqual([])
  })

  test("delete no modifica la colección si el id no existe", async () => {
    const repository = new ColectivoRepository()
    const colectivo = { id: "1", nombre: "Asamblea Ambiental" }
    await repository.save(colectivo)
    await repository.delete("id-inexistente")

    expect(await repository.findAll()).toEqual([colectivo])
  })
})
