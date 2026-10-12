import { beforeEach, describe, expect, test } from "@jest/globals"
import PerfilService from "../../../src/services/PerfilService.js"
import ProyectoService from "../../../src/services/ProyectoService.js"
import ProyectoRepository from "../../fakes/ProyectoRepository.js"
import ColectivoService from "../../../src/services/ColectivoService.js"
import ColectivoRepository from "../../fakes/ColectivoRepository.js"
import TipoColectivoRepository from "../../fakes/TipoColectivoRepository.js"
import ProvinciaRepository from "../../fakes/ProvinciaRepository.js"
import PaisRepository from "../../fakes/PaisRepository.js"
import ColaboracionRepository from "../../fakes/ColaboracionRepository.js"
import HabilidadService from "../../../src/services/HabilidadService.js"
import HabilidadRepository from "../../fakes/HabilidadRepository.js"
import {
  EntityNotFound,
  InvalidReference,
} from "../../../src/errors/ApplicationErrors.js"
import {
  DomainRuleError,
  DomainValidationError,
} from "../../../src/domain/errors/DomainErrors.js"
import { UnidadCompromiso } from "../../../src/domain/enums/UnidadCompromiso.js"
import { ModalidadColaboracion } from "../../../src/domain/enums/ModalidadColaboracion.js"

describe("PerfilService", () => {
  let service
  let proyectoService
  let proyecto
  let otroProyecto
  let habilidad1
  let habilidad2
  let datos

  beforeEach(async () => {
    const proyectoRepository = new ProyectoRepository()
    const colectivoRepository = new ColectivoRepository()
    const habilidadRepository = new HabilidadRepository()

    proyectoRepository.deleteAll()
    colectivoRepository.deleteAll()
    habilidadRepository.deleteAll()

    const colectivoService = new ColectivoService(
      colectivoRepository,
      new TipoColectivoRepository(),
      proyectoRepository,
      new ProvinciaRepository(),
      new PaisRepository(),
    )
    const habilidadService = new HabilidadService(habilidadRepository)
    proyectoService = new ProyectoService(
      proyectoRepository,
      colectivoService,
      new ColaboracionRepository(),
    )
    service = new PerfilService(
      proyectoService,
      proyectoRepository,
      habilidadService,
    )

    const colectivo = await colectivoService.create({
      nombre: "Asamblea Ambiental",
      descripcion: "Protección de humedales",
      tipo: "Asamblea",
    })
    proyecto = await proyectoService.create({
      titulo: "Plataforma de Colaboración",
      descripcion: "Plataforma para conectar colectivos sociales",
      colectivo: colectivo.id,
    })
    otroProyecto = await proyectoService.create({
      titulo: "Otro proyecto",
      descripcion: "Otro proyecto cualquiera",
      colectivo: colectivo.id,
    })

    habilidad1 = await habilidadService.create({
      titulo: "JavaScript",
      codigo: "javascript",
      descripcion: "Desarrollo con JavaScript",
    })
    habilidad2 = await habilidadService.create({
      titulo: "React",
      codigo: "react",
      descripcion: "Desarrollo con React",
    })

    datos = {
      nombre: "Tester",
      descripcion: "Perfil de testing",
      unidadCompromiso: UnidadCompromiso.HORAS_MENSUALES,
      cantidadHoras: 5,
      modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
      habilidadesRequeridas: [habilidad1.id],
      habilidadesOpcionales: [habilidad2.id],
    }
  })

  const perfilesDe = async (proyectoId) =>
    (await proyectoService.getById(proyectoId)).perfiles

  describe("create", () => {
    test("agrega el perfil al proyecto con las habilidades resueltas y lo devuelve", async () => {
      const perfil = await service.create(proyecto.id, datos)

      expect(perfil.id).toEqual(expect.any(String))
      expect(perfil.descripcion).toBe(datos.descripcion)
      expect(perfil.habilidadesRequeridas).toEqual([habilidad1])
      expect(perfil.habilidadesOpcionales).toEqual([habilidad2])
      expect(await perfilesDe(proyecto.id)).toEqual([perfil])
    })

    test("permite dos perfiles iguales en el mismo proyecto, con ids distintos", async () => {
      const primero = await service.create(proyecto.id, datos)
      const segundo = await service.create(proyecto.id, datos)

      expect(primero.id).not.toBe(segundo.id)
      expect(await perfilesDe(proyecto.id)).toHaveLength(2)
    })

    test("lanza EntityNotFound si el proyecto no existe", async () => {
      await expect(service.create("id-inexistente", datos)).rejects.toThrow(
        EntityNotFound,
      )
    })

    test.each(["habilidadesRequeridas", "habilidadesOpcionales"])(
      "lanza InvalidReference si una de %s no existe, sin crear el perfil",
      async (campo) => {
        await expect(
          service.create(proyecto.id, { ...datos, [campo]: ["inexistente"] }),
        ).rejects.toThrow(InvalidReference)
        expect(await perfilesDe(proyecto.id)).toEqual([])
      },
    )

    test("lanza DomainValidationError si el perfil es inválido, sin crearlo", async () => {
      await expect(
        service.create(proyecto.id, { ...datos, habilidadesRequeridas: [] }),
      ).rejects.toThrow(DomainValidationError)
      expect(await perfilesDe(proyecto.id)).toEqual([])
    })

    test("lanza DomainRuleError si el proyecto está cerrado", async () => {
      await proyectoService.update(proyecto.id, { estado: "CERRADO" })

      await expect(service.create(proyecto.id, datos)).rejects.toThrow(
        DomainRuleError,
      )
      expect(await perfilesDe(proyecto.id)).toEqual([])
    })
  })

  describe("consultas", () => {
    test("getAllByProyectoId devuelve solo los perfiles de ese proyecto", async () => {
      const perfil = await service.create(proyecto.id, datos)
      await service.create(otroProyecto.id, datos)

      expect(await service.getAllByProyectoId(proyecto.id)).toEqual([perfil])
    })

    test("getById devuelve el perfil dentro de su proyecto", async () => {
      const perfil = await service.create(proyecto.id, datos)

      expect(await service.getById(proyecto.id, perfil.id)).toBe(perfil)
    })

    test("getById lanza EntityNotFound si el perfil es de otro proyecto", async () => {
      const perfil = await service.create(otroProyecto.id, datos)

      await expect(service.getById(proyecto.id, perfil.id)).rejects.toThrow(
        EntityNotFound,
      )
    })

    test("lanza EntityNotFound si el proyecto no existe", async () => {
      await expect(
        service.getAllByProyectoId("id-inexistente"),
      ).rejects.toThrow(EntityNotFound)
    })
  })

  describe("update", () => {
    test("reemplaza los datos del perfil y lo devuelve", async () => {
      const perfil = await service.create(proyecto.id, datos)

      const actualizado = await service.update(proyecto.id, perfil.id, {
        ...datos,
        nombre: undefined,
        descripcion: "Descripción actualizada",
        habilidadesRequeridas: [habilidad2.id],
        habilidadesOpcionales: [habilidad1.id],
      })

      expect(actualizado.id).toBe(perfil.id)
      expect(actualizado.nombre).toBeNull()
      expect(actualizado.descripcion).toBe("Descripción actualizada")
      expect(actualizado.habilidadesRequeridas).toEqual([habilidad2])
      expect(actualizado.habilidadesOpcionales).toEqual([habilidad1])
      expect(await perfilesDe(proyecto.id)).toEqual([actualizado])
    })

    test.each([
      [
        "DomainValidationError",
        DomainValidationError,
        { habilidadesOpcionales: [] },
      ],
      [
        "InvalidReference",
        InvalidReference,
        { habilidadesRequeridas: ["inexistente"] },
      ],
    ])("lanza %s sin modificar el perfil", async (_nombre, error, cambio) => {
      const perfil = await service.create(proyecto.id, datos)
      const antes = { ...perfil }

      await expect(
        service.update(proyecto.id, perfil.id, { ...datos, ...cambio }),
      ).rejects.toThrow(error)
      expect({ ...(await service.getById(proyecto.id, perfil.id)) }).toEqual(
        antes,
      )
    })

    test("lanza EntityNotFound si el perfil es de otro proyecto", async () => {
      const perfil = await service.create(otroProyecto.id, datos)

      await expect(
        service.update(proyecto.id, perfil.id, datos),
      ).rejects.toThrow(EntityNotFound)
    })

    test("lanza DomainRuleError si el proyecto está cerrado", async () => {
      const perfil = await service.create(proyecto.id, datos)
      await proyectoService.update(proyecto.id, { estado: "CERRADO" })

      await expect(
        service.update(proyecto.id, perfil.id, { ...datos, cantidadHoras: 20 }),
      ).rejects.toThrow(DomainRuleError)
      expect(
        (await service.getById(proyecto.id, perfil.id)).cantidadHoras,
      ).toBe(5)
    })
  })

  describe("delete", () => {
    test("elimina el perfil y conserva los demás", async () => {
      const perfil = await service.create(proyecto.id, datos)
      const otro = await service.create(proyecto.id, datos)

      await service.delete(proyecto.id, perfil.id)

      expect(await perfilesDe(proyecto.id)).toEqual([otro])
    })

    test("lanza EntityNotFound si el perfil es de otro proyecto, sin borrarlo", async () => {
      const perfil = await service.create(otroProyecto.id, datos)

      await expect(service.delete(proyecto.id, perfil.id)).rejects.toThrow(
        EntityNotFound,
      )
      expect(await perfilesDe(otroProyecto.id)).toEqual([perfil])
    })

    test("lanza DomainRuleError si el proyecto está cerrado", async () => {
      const perfil = await service.create(proyecto.id, datos)
      await proyectoService.update(proyecto.id, { estado: "CERRADO" })

      await expect(service.delete(proyecto.id, perfil.id)).rejects.toThrow(
        DomainRuleError,
      )
      expect(await perfilesDe(proyecto.id)).toEqual([perfil])
    })
  })
})
