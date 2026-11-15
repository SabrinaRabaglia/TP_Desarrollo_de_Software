import { beforeEach, describe, expect, test } from "@jest/globals"
import HitoService from "../../../src/services/HitoService.js"
import ProyectoService from "../../../src/services/ProyectoService.js"
import Proyecto from "../../../src/domain/Proyecto.js"
import { Hito } from "../../../src/domain/Hito.js"
import ProyectoRepository from "../../fakes/ProyectoRepository.js"
import ColectivoRepository from "../../fakes/ColectivoRepository.js"
import { EntityNotFound } from "../../../src/errors/ApplicationErrors.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"
import { EstadoProyecto } from "../../../src/domain/enums/EstadoProyecto.js"

describe("HitoService", () => {
  let service
  let proyectoRepository
  let proyecto
  let datos

  beforeEach(async () => {
    proyectoRepository = new ProyectoRepository()
    proyectoRepository.deleteAll()
    service = new HitoService(
      new ProyectoService(proyectoRepository, new ColectivoRepository()),
      proyectoRepository,
    )
    proyecto = await proyectoRepository.save(
      new Proyecto(
        "Mapa",
        "Mapa de humedales",
        "colectivo-1",
        EstadoProyecto.PUBLICADO,
        new Date("2026-09-01"),
      ),
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

    test.each([
      ["un porcentaje fuera de rango", { porcentajeConcrecion: 150 }],
      ["una descripción vacía", { descripcion: " " }],
      [
        "una fecha anterior al alta del proyecto",
        { fecha: new Date("2026-08-15") },
      ],
    ])(
      "lanza DomainValidationError con %s, sin agregarlo",
      async (_caso, cambio) => {
        await expect(
          service.create(proyecto.id, { ...datos, ...cambio }),
        ).rejects.toThrow(DomainValidationError)
        expect(await hitosDe(proyecto.id)).toEqual([])
      },
    )

    test("admite un hito con la misma fecha que el alta del proyecto", async () => {
      const hito = await service.create(proyecto.id, {
        ...datos,
        fecha: new Date("2026-09-01"),
      })

      expect(await hitosDe(proyecto.id)).toEqual([hito])
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

    test.each([
      [
        "una fecha anterior al alta del proyecto",
        { fecha: new Date("2026-08-15") },
      ],
      ["una descripción vacía", { descripcion: "" }],
      ["un porcentaje fuera de rango", { porcentajeConcrecion: 101 }],
    ])(
      "lanza DomainValidationError con %s, sin modificarlo",
      async (_caso, cambios) => {
        const hito = await service.create(proyecto.id, datos)
        const antes = { ...hito }

        await expect(service.update(hito.id, cambios)).rejects.toThrow(
          DomainValidationError,
        )
        expect({ ...(await hitosDe(proyecto.id))[0] }).toEqual(antes)
      },
    )
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
