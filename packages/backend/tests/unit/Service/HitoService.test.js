import { beforeEach, describe, expect, test } from "@jest/globals"
import HitoService from "../../../src/services/HitoService.js"
import ProyectoService from "../../../src/services/ProyectoService.js"
import Proyecto from "../../../src/domain/Proyecto.js"
import { Hito } from "../../../src/domain/Hito.js"
import ProyectoRepository from "../../fakes/ProyectoRepository.js"
import ColectivoRepository from "../../fakes/ColectivoRepository.js"
import ColaboracionRepository from "../../fakes/ColaboracionRepository.js"
import { EntityNotFound } from "../../../src/errors/ApplicationErrors.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"

describe("HitoService", () => {
  let service
  let proyectoRepository
  let proyecto
  let datos

  beforeEach(async () => {
    proyectoRepository = new ProyectoRepository()
    proyectoRepository.deleteAll()
    service = new HitoService(
      new ProyectoService(
        proyectoRepository,
        new ColectivoRepository(),
        new ColaboracionRepository(),
      ),
      proyectoRepository,
    )
    proyecto = await proyectoRepository.save(
      new Proyecto("Mapa", "Mapa de humedales", "colectivo-1"),
    )
    datos = {
      fecha: new Date("2026-10-01"),
      porcentajeConcrecion: 50,
      descripcion: "Avance de la fase 1",
    }
  })

  const hitosDe = async (proyectoId) =>
    (await proyectoRepository.findById(proyectoId)).hitos

  describe("create", () => {
    test("agrega el hito al proyecto y lo devuelve con id", async () => {
      const hito = await service.create(proyecto.id, datos)

      expect(hito).toBeInstanceOf(Hito)
      expect(hito.id).toEqual(expect.any(String))
      expect(hito.porcentajeConcrecion).toBe(50)
      expect(hito.descripcion).toBe("Avance de la fase 1")
      expect(await hitosDe(proyecto.id)).toEqual([hito])
    })

    test("lanza EntityNotFound si el proyecto no existe", async () => {
      await expect(service.create("id-inexistente", datos)).rejects.toThrow(
        EntityNotFound,
      )
    })

    test("lanza DomainValidationError con un porcentaje fuera de rango, sin agregarlo", async () => {
      await expect(
        service.create(proyecto.id, { ...datos, porcentajeConcrecion: 150 }),
      ).rejects.toThrow(DomainValidationError)
      expect(await hitosDe(proyecto.id)).toEqual([])
    })
  })

  describe("getByProyectoId", () => {
    test("devuelve los hitos del proyecto", async () => {
      const hito = await service.create(proyecto.id, datos)

      expect(await service.getByProyectoId(proyecto.id)).toEqual([hito])
    })

    test("lanza EntityNotFound si el proyecto no existe", async () => {
      await expect(service.getByProyectoId("id-inexistente")).rejects.toThrow(
        EntityNotFound,
      )
    })
  })

  describe("update", () => {
    test("cambia solo los campos enviados y devuelve el hito", async () => {
      const hito = await service.create(proyecto.id, datos)

      const actualizado = await service.update(hito.id, {
        porcentajeConcrecion: 75,
      })

      expect(actualizado.id).toBe(hito.id)
      expect(actualizado.porcentajeConcrecion).toBe(75)
      expect(actualizado.descripcion).toBe(datos.descripcion)
      expect(await hitosDe(proyecto.id)).toEqual([actualizado])
    })

    test("lanza EntityNotFound si el hito no existe", async () => {
      await expect(
        service.update("hito-inexistente", { descripcion: "Cambio" }),
      ).rejects.toThrow(EntityNotFound)
    })
  })

  describe("delete", () => {
    test("elimina el hito y conserva los demás", async () => {
      const hito = await service.create(proyecto.id, datos)
      const otro = await service.create(proyecto.id, datos)

      await service.delete(hito.id)

      expect(await hitosDe(proyecto.id)).toEqual([otro])
    })

    test("lanza EntityNotFound si el hito no existe", async () => {
      await expect(service.delete("hito-inexistente")).rejects.toThrow(
        EntityNotFound,
      )
    })
  })
})
