import { describe, expect, test, beforeEach } from "@jest/globals"
import ProyectoRepository from "../../../src/repositories/ProyectoRepository.js"

describe("ProyectoRepository", () => {
  let repository

  beforeEach(async () => {
    repository = new ProyectoRepository()
    await repository.deleteAll()
  })

  test("findAll devuelve un array vacío si no se guardó nada", async () => {
    const repository = new ProyectoRepository()
    const proyectos = await repository.findAll()

    expect(proyectos).toEqual([])
  })

  test("save agrega un proyecto nuevo si su id no existe todavía", async () => {
    const repository = new ProyectoRepository()
    const proyecto = {
      id: "1",
      titulo: "Plataforma de Colaboración",
      cantHoras: 10,
    }
    const guardado = await repository.save(proyecto)

    expect(guardado).toBe(proyecto)
    expect(await repository.findAll()).toEqual([proyecto])
  })

  test("save pisa el proyecto existente si el id ya está guardado (upsert)", async () => {
    const repository = new ProyectoRepository()
    const proyectoOriginal = { id: "1", titulo: "Plataforma V1", cantHoras: 10 }
    await repository.save(proyectoOriginal)
    const proyectoActualizado = {
      id: "1",
      titulo: "Plataforma V2",
      cantHoras: 15,
    }
    await repository.save(proyectoActualizado)

    expect(await repository.findAll()).toHaveLength(1)
    expect((await repository.findAll())[0].titulo).toBe("Plataforma V2")
  })

  test("findById encuentra el proyecto correcto por id", async () => {
    const repository = new ProyectoRepository()
    const proyecto1 = { id: "1", titulo: "Proyecto 1" }
    const proyecto2 = { id: "2", titulo: "Proyecto 2" }
    await repository.save(proyecto1)
    await repository.save(proyecto2)
    const encontrado = await repository.findById("2")

    expect(encontrado).toBe(proyecto2)
  })

  test("findById devuelve undefined si no existe ninguno con ese id", async () => {
    const repository = new ProyectoRepository()
    const encontrado = await repository.findById("id-inexistente")

    expect(encontrado).toBeUndefined()
  })

  test("findByTitulo encuentra el proyecto correcto por título", async () => {
    const repository = new ProyectoRepository()
    const proyecto = { id: "1", titulo: "Plataforma de Colaboración" }
    await repository.save(proyecto)
    const encontrado = await repository.findByTitulo("Plataforma de Colaboración")

    expect(encontrado).toBe(proyecto)
  })

  test("findByTitulo devuelve undefined si no existe ninguno con ese título", async () => {
    const repository = new ProyectoRepository()
    const encontrado = await repository.findByTitulo("no-existe")

    expect(encontrado).toBeUndefined()
  })

  test("delete borra el proyecto de la colección", async () => {
    const repository = new ProyectoRepository()
    const proyecto = { id: "1", titulo: "Plataforma de Colaboración" }
    await repository.save(proyecto)
    await repository.delete("1")

    expect(await repository.findAll()).toEqual([])
  })

  test("delete no modifica la colección si el id no existe", async () => {
    const repository = new ProyectoRepository()
    const proyecto = { id: "1", titulo: "Plataforma de Colaboración" }
    await repository.save(proyecto)
    await repository.delete("id-inexistente")

    expect(await repository.findAll()).toEqual([proyecto])
  })
})
