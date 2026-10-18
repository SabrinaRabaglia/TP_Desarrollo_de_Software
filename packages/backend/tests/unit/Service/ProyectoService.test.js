import { beforeEach, describe, expect, test } from "@jest/globals"
import ProyectoService from "../../../src/services/ProyectoService.js"
import ProyectoRepository from "../../fakes/ProyectoRepository.js"
import ColectivoService from "../../../src/services/ColectivoService.js"
import ColectivoRepository from "../../fakes/ColectivoRepository.js"
import TipoColectivoRepository from "../../fakes/TipoColectivoRepository.js"
import ProvinciaRepository from "../../fakes/ProvinciaRepository.js"
import PaisRepository from "../../fakes/PaisRepository.js"
import ColaboracionRepository from "../../fakes/ColaboracionRepository.js"
import {
  AlreadyExists,
  EntityNotFound,
  InvalidReference,
} from "../../../src/errors/ApplicationErrors.js"
import {
  DomainValidationError,
  DomainRuleError,
} from "../../../src/domain/errors/DomainErrors.js"
import { EstadoProyecto } from "../../../src/domain/enums/EstadoProyecto.js"
import Perfil from "../../../src/domain/Perfil.js"
import { UnidadCompromiso } from "../../../src/domain/enums/UnidadCompromiso.js"
import { ModalidadColaboracion } from "../../../src/domain/enums/ModalidadColaboracion.js"

describe("ProyectoService", () => {
  let service
  let colectivoService
  let proyectoRepository
  let colaboracionRepository
  let dtoProyectoValido

  beforeEach(async () => {
    proyectoRepository = new ProyectoRepository()
    const colectivoRepository = new ColectivoRepository()
    const tipoColectivoRepository = new TipoColectivoRepository()

    proyectoRepository.deleteAll()
    colectivoRepository.deleteAll()

    colectivoService = new ColectivoService(
      colectivoRepository,
      tipoColectivoRepository,
      proyectoRepository,
      new ProvinciaRepository(),
      new PaisRepository(),
    )
    colaboracionRepository = new ColaboracionRepository()
    service = new ProyectoService(
      proyectoRepository,
      colectivoRepository,
      colaboracionRepository,
    )

    const colectivo = (await colectivoService.create({
      nombre: "Asamblea Ambiental",
      descripcion: "Protección de humedales",
      tipo: "Asamblea",
    })).colectivo

    dtoProyectoValido = {
      titulo: "Plataforma de Colaboración",
      descripcion: "Plataforma para conectar colectivos sociales",
      colectivo: colectivo.id,
      estado: EstadoProyecto.PUBLICADO,
    }
  })

  test("rechaza una fecha de cierre anterior a la fecha de alta al crear y actualizar sin alterar los datos", async () => {
    const cambios = {
      fechaAlta: new Date("2026-09-11"),
      fechaCierre: new Date("2026-01-01"),
    }
    await expect(
      service.create({ ...dtoProyectoValido, ...cambios }),
    ).rejects.toThrow(DomainValidationError)
    expect(await service.getAll()).toEqual([])

    const proyecto = await service.create(dtoProyectoValido)
    const antes = { ...proyecto }

    await expect(
      service.update(proyecto.id, {
        titulo: "No debe guardarse",
        ...cambios,
      }),
    ).rejects.toThrow(DomainValidationError)
    expect(await service.getById(proyecto.id)).toEqual(antes)
  })

  describe("create", () => {
    test("crea y guarda un proyecto cuando el título no existe todavía", async () => {
      const proyectoCreado = await service.create(dtoProyectoValido)

      expect(proyectoCreado.titulo).toBe(dtoProyectoValido.titulo)
      expect(proyectoCreado.descripcion).toBe(dtoProyectoValido.descripcion)
      expect(proyectoCreado.colectivo).toBe(dtoProyectoValido.colectivo)
      expect(proyectoCreado.perfiles).toEqual([])
      expect(await service.getAll()).toEqual([proyectoCreado])
    })

    test("rechaza un colectivo inexistente sin guardar el proyecto", async () => {
      await expect(
        service.create({
          ...dtoProyectoValido,
          colectivo: "colectivo-inexistente",
        }),
      ).rejects.toThrow(InvalidReference)

      expect(await service.getAll()).toHaveLength(0)
    })

    test("tira AlreadyExists si ya existe un proyecto con el mismo título", async () => {
      await service.create(dtoProyectoValido)

      await expect(
        service.create({
          ...dtoProyectoValido,
          descripcion: "Otra descripción",
        }),
      ).rejects.toThrow(AlreadyExists)

      expect(await service.getAll()).toHaveLength(1)
    })
  })

  describe("getById", () => {
    test("devuelve el proyecto correspondiente cuando se encuentra por ID", async () => {
      const creado = await service.create(dtoProyectoValido)

      const encontrado = await service.getById(creado.id)

      expect(encontrado).toBeDefined()
      expect(encontrado.id).toBe(creado.id)
      expect(encontrado.titulo).toBe(dtoProyectoValido.titulo)
    })

    test("lanza EntityNotFound si el proyecto no existe", async () => {
      await expect(service.getById("id-inexistente")).rejects.toThrow(
        EntityNotFound,
      )
    })
  })

  describe("update", () => {
    test("actualiza un proyecto existente correctamente", async () => {
      const creado = await service.create(dtoProyectoValido)

      const actualizado = await service.update(creado.id, {
        titulo: "Nuevo Título",
      })

      expect(actualizado.titulo).toBe("Nuevo Título")
      expect(actualizado.colectivo).toBe(dtoProyectoValido.colectivo)
    })

    test("rechaza un colectivo inexistente sin modificar ningún campo", async () => {
      const creado = await service.create(dtoProyectoValido)
      const antes = { ...creado }

      await expect(
        service.update(creado.id, {
          titulo: "Este título no debe guardarse",
          colectivo: "colectivo-inexistente",
        }),
      ).rejects.toThrow(InvalidReference)

      expect(await service.getById(creado.id)).toEqual(antes)
      expect(await service.getAll()).toHaveLength(1)
    })

    test("permite cambiar el colectivo por otro existente", async () => {
      const creado = await service.create(dtoProyectoValido)
      const colectivo = (await colectivoService.create({
        nombre: "Otra organización",
        descripcion: "Proyecto comunitario",
        tipo: "ONG",
      })).colectivo

      await service.update(creado.id, { colectivo: colectivo.id })

      const actualizado = await service.getById(creado.id)
      expect(actualizado.colectivo).toBe(colectivo.id)
    })

    test("lanza EntityNotFound si intenta actualizar un proyecto inexistente", async () => {
      await expect(
        service.update("id-inexistente", { titulo: "Nuevo" }),
      ).rejects.toThrow(EntityNotFound)
    })
  })

  describe("delete", () => {
    test("elimina el proyecto correctamente si existe", async () => {
      const creado = await service.create(dtoProyectoValido)

      await service.delete(creado.id)

      expect(await service.getAll()).toHaveLength(0)
    })

    test("elimina las colaboraciones del proyecto y conserva las de otros", async () => {
      const creado = await service.create(dtoProyectoValido)
      const persona = { id: "persona-1" }
      await colaboracionRepository.save({
        personaColaboradora: persona,
        proyecto: { id: creado.id },
      })
      await colaboracionRepository.save({
        personaColaboradora: persona,
        proyecto: { id: "otro-proyecto" },
      })

      await service.delete(creado.id)

      expect(await colaboracionRepository.findAll()).toEqual([
        { personaColaboradora: persona, proyecto: { id: "otro-proyecto" } },
      ])
    })

    test("lanza EntityNotFound al intentar eliminar un proyecto inexistente", async () => {
      await expect(service.delete("id-inexistente")).rejects.toThrow(
        EntityNotFound,
      )
    })
  })

  describe("cerrar proyecto", () => {
    test("cierra y guarda el proyecto al actualizar el estado", async () => {
      const creado = await service.create(dtoProyectoValido)

      const cerrado = await service.update(creado.id, {
        estado: EstadoProyecto.CERRADO,
      })

      expect(cerrado.estado).toBe(EstadoProyecto.CERRADO)
      expect(cerrado.fechaCierre).toBeInstanceOf(Date)
      expect(await service.getById(creado.id)).toBe(cerrado)
    })

    test("lanza EntityNotFound si el proyecto no existe", async () => {
      await expect(
        service.update("id-inexistente", { estado: EstadoProyecto.CERRADO }),
      ).rejects.toThrow(EntityNotFound)
    })

    test("rechaza un segundo cierre sin alterar la fecha", async () => {
      const creado = await service.create(dtoProyectoValido)
      const cerrado = await service.update(creado.id, {
        estado: EstadoProyecto.CERRADO,
      })
      const fechaCierre = cerrado.fechaCierre

      await expect(
        service.update(creado.id, { estado: EstadoProyecto.CERRADO }),
      ).rejects.toThrow(DomainRuleError)
      expect((await service.getById(creado.id)).fechaCierre).toBe(fechaCierre)
    })

    test("rechaza reabrir un proyecto sin aplicar cambios parciales", async () => {
      const creado = await service.create(dtoProyectoValido)
      await service.update(creado.id, { estado: EstadoProyecto.CERRADO })
      const antes = { ...creado }

      await expect(
        service.update(creado.id, {
          titulo: "No debe guardarse",
          estado: EstadoProyecto.PUBLICADO,
          fechaCierre: null,
        }),
      ).rejects.toThrow(DomainRuleError)
      expect(await service.getById(creado.id)).toEqual(antes)

      const editado = await service.update(creado.id, {
        descripcion: "Descripción actualizada",
      })
      expect(editado.estado).toBe(EstadoProyecto.CERRADO)
      expect(editado.fechaCierre).toEqual(antes.fechaCierre)
    })
  })

  describe("getAllByHabilidades", () => {
    const crearConPerfil = async (titulo, habilidadesRequeridas) => {
      const proyecto = await service.create({ ...dtoProyectoValido, titulo })
      proyecto.agregarPerfil(
        new Perfil({
          descripcion: `Perfil de ${titulo}`,
          unidadCompromiso: UnidadCompromiso.HORAS_MENSUALES,
          cantidadHoras: 5,
          modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
          habilidadesRequeridas,
          habilidadesOpcionales: ["docker"],
        }),
      )
      return await proyectoRepository.save(proyecto)
    }

    test("devuelve los proyectos con algún perfil cuyas habilidades requeridas estén todas cubiertas", async () => {
      const web = await crearConPerfil("Sitio web", ["javascript", "react"])
      const mapa = await crearConPerfil("Mapa", ["javascript"])
      await crearConPerfil("Análisis", ["python"])

      expect(
        await service.getAllByHabilidades(["javascript", "react", "sql"]),
      ).toEqual([web, mapa])
      expect(await service.getAllByHabilidades(["javascript"])).toEqual([mapa])
      expect(await service.getAllByHabilidades(["sql"])).toEqual([])
    })

    test("no devuelve un proyecto si solo se cubre parte de las requeridas de un perfil", async () => {
      await crearConPerfil("Sitio web", ["javascript", "react"])

      expect(await service.getAllByHabilidades(["react"])).toEqual([])
    })

    test("no devuelve proyectos cerrados", async () => {
      const abierto = await crearConPerfil("Abierto", ["javascript"])
      const cerrado = await crearConPerfil("Cerrado", ["javascript"])
      await service.update(cerrado.id, { estado: EstadoProyecto.CERRADO })

      expect(await service.getAllByHabilidades(["javascript"])).toEqual([
        abierto,
      ])
    })
  })
})
