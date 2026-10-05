import { describe, expect, test, beforeEach } from "@jest/globals"
import HabilidadService from "../../../src/services/HabilidadService.js"
import HabilidadRepository from "../../fakes/HabilidadRepository.js"
import { AlreadyExists, EntityNotFound } from "../../../src/errors/ApplicationErrors.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"

describe("HabilidadService", () => {

  // Limpiamos la memoria estática antes de cada test para evitar colisiones
  beforeEach(() => {
    new HabilidadRepository().deleteAll()
  })

  describe("create", () => {
    test("crea y guarda una habilidad cuando el código no existe todavía", async () => {
      const service = new HabilidadService(new HabilidadRepository())
      const nueva = {
        titulo: "   Programación    Web / React   ",
        codigo: "programacion_web_react",
        descripcion: "desc",
      }
      const habilidad = await service.create(nueva)

      expect(habilidad.titulo).toBe(nueva.titulo)
      expect(habilidad.codigo).toBe(nueva.codigo)
      expect(habilidad.descripcion).toBe(nueva.descripcion)
      expect(await service.getAll()).toEqual([habilidad])
    })

    test("tira AlreadyExists si ya existe una habilidad con el mismo código", async () => {
      const service = new HabilidadService(new HabilidadRepository())
      await service.create({ titulo: "React", codigo: "react", descripcion: "desc" })
      
      const crearHabilidadConCodigoRepetido = async () =>
        await service.create({
          titulo: "REACT",
          codigo: "react",
          descripcion: "otra desc",
        })

      await expect(crearHabilidadConCodigoRepetido()).rejects.toThrow(AlreadyExists)
      expect(await service.getAll()).toHaveLength(1)
    })

    test("rechaza un código que no corresponde al título sin guardar la habilidad", async () => {
      const service = new HabilidadService(new HabilidadRepository())

      await expect(
        service.create({
          titulo: "Desarrollo Web React",
          codigo: "react",
          descripcion: "desc",
        })
      ).rejects.toThrow(DomainValidationError)

      expect(await service.getAll()).toEqual([])
    })
  })

  describe("update", () => {
    test("rechaza una descripción vacía sin modificar la habilidad", async () => {
      const service = new HabilidadService(new HabilidadRepository())
      const habilidad = await service.create({
        titulo: "React",
        codigo: "react",
        descripcion: "desc",
      })
      const antes = { ...habilidad }

      await expect(
        service.update(habilidad.id, {
          titulo: "Node",
          codigo: "node",
          descripcion: "",
        }),
      ).rejects.toThrow(DomainValidationError)

      expect(await service.getById(habilidad.id)).toEqual(antes)
    })

    test("actualiza los datos de una habilidad existente, conservando su id", async () => {
      const service = new HabilidadService(new HabilidadRepository())
      const habilidad = await service.create({
        titulo: "React",
        codigo: "react",
        descripcion: "desc",
      })
      const actualizada = await service.update(habilidad.id, {
        titulo: "React actualizado",
        codigo: "react_actualizado",
        descripcion: "nueva desc",
      })

      expect(actualizada.id).toBe(habilidad.id)
      expect(actualizada.titulo).toBe("React actualizado")
      expect(actualizada.codigo).toBe("react_actualizado")
      expect(actualizada.descripcion).toBe("nueva desc")
    })

    test("tira EntityNotFound si el id no corresponde a ninguna habilidad", async () => {
      const service = new HabilidadService(new HabilidadRepository())
      
      await expect(
        service.update("id-inexistente", {
          titulo: "x",
          codigo: "y",
          descripcion: "z",
        })
      ).rejects.toThrow(EntityNotFound)
    })

    test("tira AlreadyExists si el nuevo código pertenece a OTRA habilidad existente", async () => {
      const service = new HabilidadService(new HabilidadRepository())
      const react = await service.create({
        titulo: "React",
        codigo: "react",
        descripcion: "desc",
      })
      await service.create({ titulo: "Node", codigo: "node", descripcion: "desc" })

      await expect(
        service.update(react.id, {
          titulo: "Node",
          codigo: "node",
          descripcion: "desc",
        })
      ).rejects.toThrow(AlreadyExists)
    })

    test("permite actualizar una habilidad conservando su propio código (no es conflicto consigo misma)", async () => {
      const service = new HabilidadService(new HabilidadRepository())
      const habilidad = await service.create({
        titulo: "React",
        codigo: "react",
        descripcion: "desc",
      })

      const actualizada = await service.update(habilidad.id, {
        titulo: "REACT",
        codigo: "react",
        descripcion: "desc",
      })

      expect(actualizada.codigo).toBe("react")
      expect(actualizada.titulo).toBe("REACT")
    })

    test("rechaza un código incorrecto al actualizar sin modificar la habilidad", async () => {
      const service = new HabilidadService(new HabilidadRepository())
      const habilidad = await service.create({
        titulo: "React",
        codigo: "react",
        descripcion: "desc",
      })
      const antes = { ...habilidad }

      await expect(
        service.update(habilidad.id, {
          titulo: "Desarrollo Web React",
          codigo: "react",
          descripcion: "Nueva descripción",
        })
      ).rejects.toThrow(DomainValidationError)

      expect(await service.getById(habilidad.id)).toEqual(antes)
    })
  })

  describe("delete", () => {
    test("elimina una habilidad existente", async () => {
      const service = new HabilidadService(new HabilidadRepository())
      const habilidad = await service.create({
        titulo: "React",
        codigo: "react",
        descripcion: "desc",
      })

      await service.delete(habilidad.id)

      expect(await service.getAll()).toEqual([])
    })

    test("tira EntityNotFound si el id no corresponde a ninguna habilidad", async () => {
      const service = new HabilidadService(new HabilidadRepository())
      
      await expect(service.delete("id-inexistente")).rejects.toThrow(EntityNotFound)
    })
  })

  describe("getById", () => {
    test("devuelve la habilidad correcta cuando existe", async () => {
      const service = new HabilidadService(new HabilidadRepository())
      const habilidad = await service.create({
        titulo: "React",
        codigo: "react",
        descripcion: "desc",
      })

      const encontrada = await service.getById(habilidad.id)

      expect(encontrada).toEqual(habilidad)
    })

    test("tira EntityNotFound si el id no corresponde a ninguna habilidad", async () => {
      const service = new HabilidadService(new HabilidadRepository())

      await expect(service.getById("id-inexistente")).rejects.toThrow(EntityNotFound)
    })
  })

  describe("getAll", () => {
    test("devuelve todas las habilidades guardadas", async () => {
      const service = new HabilidadService(new HabilidadRepository())
      const react = await service.create({
        titulo: "React",
        codigo: "react",
        descripcion: "desc",
      })
      const node = await service.create({
        titulo: "Node",
        codigo: "node",
        descripcion: "desc",
      })

      const habilidades = await service.getAll()

      expect(habilidades).toEqual([react, node])
    })
  })
})