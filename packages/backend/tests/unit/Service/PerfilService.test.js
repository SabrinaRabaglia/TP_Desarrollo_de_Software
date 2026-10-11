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
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"
import { UnidadCompromiso } from "../../../src/domain/enums/UnidadCompromiso.js"
import { ModalidadColaboracion } from "../../../src/domain/enums/ModalidadColaboracion.js"

describe("PerfilService", () => {
  let service
  let proyectoService
  let proyecto
  let otroProyecto
  let habilidad1
  let habilidad2
  let dtoPerfilValido

  beforeEach(async () => {
    const proyectoRepository = new ProyectoRepository()
    const colectivoRepository = new ColectivoRepository()
    const tipoColectivoRepository = new TipoColectivoRepository()
    const habilidadRepository = new HabilidadRepository()

    proyectoRepository.deleteAll()
    colectivoRepository.deleteAll()
    habilidadRepository.deleteAll()

    const colectivoService = new ColectivoService(
      colectivoRepository,
      tipoColectivoRepository,
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
    service = new PerfilService(proyectoService, habilidadService)

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

    dtoPerfilValido = {
      nombre: "Tester",
      descripcion: "Perfil de testing",
      unidadCompromiso: UnidadCompromiso.HORAS_MENSUALES,
      cantidadHoras: 5,
      modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
      habilidadesRequeridas: [habilidad1.id],
      habilidadesOpcionales: [habilidad2.id],
    }
  })

  describe("create", () => {
    test("crea y embebe un perfil en el proyecto, resolviendo las habilidades", async () => {
      const proyectoActualizado = await service.create(dtoPerfilValido, proyecto.id)

      expect(proyectoActualizado.perfiles).toHaveLength(1)
      const perfil = proyectoActualizado.perfiles[0]
      expect(perfil.id).toBeDefined()
      expect(perfil.nombre).toBe("Tester")
      expect(perfil.descripcion).toBe("Perfil de testing")
      expect(perfil.habilidadesRequeridas).toEqual([habilidad1])
      expect(perfil.habilidadesOpcionales).toEqual([habilidad2])
    })

    test("permite crear dos perfiles idénticos en el mismo proyecto, con ids distintos", async () => {
      await service.create(dtoPerfilValido, proyecto.id)
      const actualizado = await service.create(dtoPerfilValido, proyecto.id)

      expect(actualizado.perfiles).toHaveLength(2)
      const [perfil1, perfil2] = actualizado.perfiles
      expect(perfil1.id).not.toBe(perfil2.id)
      expect(perfil1.descripcion).toBe(perfil2.descripcion)
      expect(perfil1.habilidadesRequeridas).toEqual(perfil2.habilidadesRequeridas)
    })

    test("lanza EntityNotFound si el proyecto no existe", async () => {
      await expect(
        service.create(dtoPerfilValido, "proyecto-inexistente"),
      ).rejects.toThrow(EntityNotFound)
    })

    test("lanza InvalidReference si una habilidad requerida no existe, sin crear el perfil", async () => {
      await expect(
        service.create(
          { ...dtoPerfilValido, habilidadesRequeridas: ["habilidad-inexistente"] },
          proyecto.id,
        ),
      ).rejects.toThrow(InvalidReference)

      expect((await proyectoService.getById(proyecto.id)).perfiles).toHaveLength(0)
    })

    test("lanza InvalidReference si una habilidad opcional no existe, sin crear el perfil", async () => {
      await expect(
        service.create(
          { ...dtoPerfilValido, habilidadesOpcionales: ["habilidad-inexistente"] },
          proyecto.id,
        ),
      ).rejects.toThrow(InvalidReference)

      expect((await proyectoService.getById(proyecto.id)).perfiles).toHaveLength(0)
    })

    test("lanza DomainValidationError si falta la descripción", async () => {
      await expect(
        service.create({ ...dtoPerfilValido, descripcion: undefined }, proyecto.id),
      ).rejects.toThrow(DomainValidationError)
    })

    test("lanza DomainValidationError si no hay habilidades requeridas", async () => {
      await expect(
        service.create({ ...dtoPerfilValido, habilidadesRequeridas: [] }, proyecto.id),
      ).rejects.toThrow(DomainValidationError)
    })

    test("lanza DomainValidationError si no hay habilidades opcionales", async () => {
      await expect(
        service.create({ ...dtoPerfilValido, habilidadesOpcionales: [] }, proyecto.id),
      ).rejects.toThrow(DomainValidationError)
    })

    test("permite crear un perfil sin nombre, unidadCompromiso, cantidadHoras ni modalidades (son opcionales)", async () => {
      const { nombre, unidadCompromiso, cantidadHoras, modalidadesColaboracion, ...minimo } =
        dtoPerfilValido

      const proyectoActualizado = await service.create(minimo, proyecto.id)

      const perfil = proyectoActualizado.perfiles[0]
      expect(perfil.nombre).toBeNull()
      expect(perfil.unidadCompromiso).toBeNull()
      expect(perfil.cantidadHoras).toBeNull()
      expect(perfil.modalidadesColaboracion).toEqual([])
    })
  })

  describe("getAllByProyectoId", () => {
    test("devuelve solo los perfiles del proyecto indicado", async () => {
      await service.create(dtoPerfilValido, proyecto.id)
      await service.create(dtoPerfilValido, otroProyecto.id)

      const perfiles = await service.getAllByProyectoId(proyecto.id)

      expect(perfiles).toHaveLength(1)
    })

    test("devuelve un array vacío si el proyecto no tiene perfiles", async () => {
      expect(await service.getAllByProyectoId(proyecto.id)).toEqual([])
    })

    test("lanza EntityNotFound si el proyecto no existe", async () => {
      await expect(
        service.getAllByProyectoId("proyecto-inexistente"),
      ).rejects.toThrow(EntityNotFound)
    })
  })

  describe("getAll", () => {
    test("devuelve los perfiles de todos los proyectos juntos", async () => {
      await service.create(dtoPerfilValido, proyecto.id)
      await service.create(dtoPerfilValido, proyecto.id)
      await service.create(dtoPerfilValido, otroProyecto.id)

      expect(await service.getAll()).toHaveLength(3)
    })

    test("devuelve un array vacío si no hay perfiles en ningún proyecto", async () => {
      expect(await service.getAll()).toEqual([])
    })
  })

  describe("getById", () => {
    test("devuelve el perfil correspondiente dentro del proyecto", async () => {
      const actualizado = await service.create(dtoPerfilValido, proyecto.id)
      const perfilId = actualizado.perfiles[0].id

      const perfil = await service.getById(proyecto.id, perfilId)

      expect(perfil.id).toBe(perfilId)
      expect(perfil.descripcion).toBe(dtoPerfilValido.descripcion)
    })

    test("lanza EntityNotFound si el perfil no existe en ese proyecto", async () => {
      await service.create(dtoPerfilValido, proyecto.id)

      await expect(
        service.getById(proyecto.id, "perfil-inexistente"),
      ).rejects.toThrow(EntityNotFound)
    })

    test("lanza EntityNotFound si el perfil existe pero pertenece a otro proyecto", async () => {
      const actualizado = await service.create(dtoPerfilValido, proyecto.id)
      const perfilId = actualizado.perfiles[0].id

      await expect(service.getById(otroProyecto.id, perfilId)).rejects.toThrow(
        EntityNotFound,
      )
    })

    test("lanza EntityNotFound si el proyecto no existe", async () => {
      await expect(
        service.getById("proyecto-inexistente", "cualquier-id"),
      ).rejects.toThrow(EntityNotFound)
    })
  })

  describe("delete", () => {
    test("elimina el perfil del proyecto", async () => {
      const actualizado = await service.create(dtoPerfilValido, proyecto.id)
      const perfilId = actualizado.perfiles[0].id

      await service.delete(proyecto.id, perfilId)

      expect((await proyectoService.getById(proyecto.id)).perfiles).toEqual([])
    })

    test("al borrar un perfil duplicado, conserva el resto intactos", async () => {
      await service.create(dtoPerfilValido, proyecto.id)
      const actualizado = await service.create(dtoPerfilValido, proyecto.id)
      const [aBorrar, aConservar] = actualizado.perfiles

      await service.delete(proyecto.id, aBorrar.id)

      const perfilesRestantes = (await proyectoService.getById(proyecto.id)).perfiles
      expect(perfilesRestantes).toHaveLength(1)
      expect(perfilesRestantes[0].id).toBe(aConservar.id)
    })

    test("lanza EntityNotFound si el perfil no existe en ese proyecto", async () => {
      await service.create(dtoPerfilValido, proyecto.id)

      await expect(
        service.delete(proyecto.id, "perfil-inexistente"),
      ).rejects.toThrow(EntityNotFound)
    })

    test("lanza EntityNotFound si el perfil existe pero pertenece a otro proyecto, sin borrarlo", async () => {
      const actualizado = await service.create(dtoPerfilValido, proyecto.id)
      const perfilId = actualizado.perfiles[0].id

      await expect(service.delete(otroProyecto.id, perfilId)).rejects.toThrow(
        EntityNotFound,
      )
      expect((await proyectoService.getById(proyecto.id)).perfiles).toHaveLength(1)
    })

    test("lanza EntityNotFound si el proyecto no existe", async () => {
      await expect(
        service.delete("proyecto-inexistente", "perfil-1"),
      ).rejects.toThrow(EntityNotFound)
    })
  })

  describe("update", () => {
    const actualizarYBuscar = async (proyectoId, perfilId, cambios) => {
      const proyectoActualizado = await service.update(proyectoId, perfilId, cambios)
      return proyectoActualizado.perfiles.find((p) => p.id === perfilId)
    }

    test("actualiza los campos de un perfil existente sin duplicarlo", async () => {
      const creado = await service.create(dtoPerfilValido, proyecto.id)
      const perfilId = creado.perfiles[0].id

      const proyectoActualizado = await service.update(proyecto.id, perfilId, {
        ...dtoPerfilValido,
        descripcion: "Descripción actualizada",
        habilidadesRequeridas: [habilidad2.id],
        habilidadesOpcionales: [habilidad1.id],
      })

      expect(proyectoActualizado.perfiles).toHaveLength(1)
      const perfil = proyectoActualizado.perfiles[0]
      expect(perfil.id).toBe(perfilId)
      expect(perfil.descripcion).toBe("Descripción actualizada")
      expect(perfil.habilidadesRequeridas).toEqual([habilidad2])
      expect(perfil.habilidadesOpcionales).toEqual([habilidad1])
    })

    test("campos no obligatorios: si no se envían, el perfil queda con ellos en null/vacío", async () => {
      const creado = await service.create(dtoPerfilValido, proyecto.id)
      const perfilId = creado.perfiles[0].id

      const perfil = await actualizarYBuscar(proyecto.id, perfilId, {
        descripcion: "Sin campos opcionales",
        habilidadesRequeridas: [habilidad1.id],
        habilidadesOpcionales: [habilidad2.id],
      })

      expect(perfil.nombre).toBeNull()
      expect(perfil.unidadCompromiso).toBeNull()
      expect(perfil.cantidadHoras).toBeNull()
      expect(perfil.modalidadesColaboracion).toBeNull()
    })

    test("campos no obligatorios: se pueden actualizar a un valor nuevo", async () => {
      const creado = await service.create(dtoPerfilValido, proyecto.id)
      const perfilId = creado.perfiles[0].id

      const perfil = await actualizarYBuscar(proyecto.id, perfilId, {
        nombre: "Nuevo nombre",
        descripcion: "Con campos opcionales nuevos",
        unidadCompromiso: UnidadCompromiso.HORAS_TOTALES,
        cantidadHoras: 20,
        modalidadesColaboracion: [ModalidadColaboracion.CON_INCENTIVO_ECONOMICO],
        habilidadesRequeridas: [habilidad1.id],
        habilidadesOpcionales: [habilidad2.id],
      })

      expect(perfil.nombre).toBe("Nuevo nombre")
      expect(perfil.unidadCompromiso).toBe(UnidadCompromiso.HORAS_TOTALES)
      expect(perfil.cantidadHoras).toBe(20)
      expect(perfil.modalidadesColaboracion).toEqual([
        ModalidadColaboracion.CON_INCENTIVO_ECONOMICO,
      ])
    })

    test("rechaza actualizar la descripción (obligatoria) a null, sin modificar el perfil", async () => {
      const creado = await service.create(dtoPerfilValido, proyecto.id)
      const perfilId = creado.perfiles[0].id

      await expect(
        service.update(proyecto.id, perfilId, {
          ...dtoPerfilValido,
          descripcion: null,
        }),
      ).rejects.toThrow(DomainValidationError)

      const perfil = (await proyectoService.getById(proyecto.id)).perfiles[0]
      expect(perfil.descripcion).toBe(dtoPerfilValido.descripcion)
    })

    test("rechaza vaciar las habilidades requeridas (obligatorias), sin modificar el perfil", async () => {
      const creado = await service.create(dtoPerfilValido, proyecto.id)
      const perfilId = creado.perfiles[0].id

      await expect(
        service.update(proyecto.id, perfilId, {
          ...dtoPerfilValido,
          habilidadesRequeridas: [],
        }),
      ).rejects.toThrow(DomainValidationError)

      const perfil = (await proyectoService.getById(proyecto.id)).perfiles[0]
      expect(perfil.habilidadesRequeridas).toEqual([habilidad1])
    })

    test("rechaza vaciar las habilidades opcionales (obligatorias), sin modificar el perfil", async () => {
      const creado = await service.create(dtoPerfilValido, proyecto.id)
      const perfilId = creado.perfiles[0].id

      await expect(
        service.update(proyecto.id, perfilId, {
          ...dtoPerfilValido,
          habilidadesOpcionales: [],
        }),
      ).rejects.toThrow(DomainValidationError)

      const perfil = (await proyectoService.getById(proyecto.id)).perfiles[0]
      expect(perfil.habilidadesOpcionales).toEqual([habilidad2])
    })

    test("lanza InvalidReference si una habilidad nueva no existe, sin modificar el perfil", async () => {
      const creado = await service.create(dtoPerfilValido, proyecto.id)
      const perfilId = creado.perfiles[0].id

      await expect(
        service.update(proyecto.id, perfilId, {
          ...dtoPerfilValido,
          habilidadesRequeridas: ["habilidad-inexistente"],
        }),
      ).rejects.toThrow(InvalidReference)

      const perfil = (await proyectoService.getById(proyecto.id)).perfiles[0]
      expect(perfil.habilidadesRequeridas).toEqual([habilidad1])
    })

    test("lanza EntityNotFound si el perfil no existe en ese proyecto", async () => {
      await expect(
        service.update(proyecto.id, "perfil-inexistente", dtoPerfilValido),
      ).rejects.toThrow(EntityNotFound)
    })

    test("lanza EntityNotFound si el perfil existe pero pertenece a otro proyecto", async () => {
      const creado = await service.create(dtoPerfilValido, proyecto.id)
      const perfilId = creado.perfiles[0].id

      await expect(
        service.update(otroProyecto.id, perfilId, dtoPerfilValido),
      ).rejects.toThrow(EntityNotFound)
    })

    test("lanza EntityNotFound si el proyecto no existe", async () => {
      await expect(
        service.update("proyecto-inexistente", "perfil-1", dtoPerfilValido),
      ).rejects.toThrow(EntityNotFound)
    })
  })
})
