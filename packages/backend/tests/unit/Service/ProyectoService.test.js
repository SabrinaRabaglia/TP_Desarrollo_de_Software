import { beforeEach, describe, expect, test } from "@jest/globals"
import ProyectoService from "../../../src/services/ProyectoService.js"
import ProyectoRepository from "../../fakes/ProyectoRepository.js"
import ColectivoService from "../../../src/services/ColectivoService.js"
import ColectivoRepository from "../../fakes/ColectivoRepository.js"
import TipoColectivoRepository from "../../fakes/TipoColectivoRepository.js"
import ProvinciaRepository from "../../fakes/ProvinciaRepository.js"
import PaisRepository from "../../fakes/PaisRepository.js"
import {
  AlreadyExists,
  EntityNotFound,
  InvalidReference,
  NoAutorizado,
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
  let dtoProyectoValido

  const obtenerDatos = (respuesta) => respuesta.data

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
    service = new ProyectoService(proyectoRepository, colectivoRepository)

    const colectivo = await colectivoService.create({
      nombre: "Asamblea Ambiental",
      descripcion: "Protección de humedales",
      tipo: "Asamblea",
    })

    dtoProyectoValido = {
      titulo: "Plataforma de Colaboración",
      descripcion: "Plataforma para conectar colectivos sociales",
      colectivo: colectivo.id,
      estado: EstadoProyecto.PUBLICADO,
    }
  })

  test("rechaza una fecha de cierre anterior a la fecha de alta al crear y actualizar sin alterar los datos", async () => {
    const cambios = { fechaCierre: new Date("2026-01-01") }
    await expect(
      service.create({ ...dtoProyectoValido, ...cambios }),
    ).rejects.toThrow(DomainValidationError)
    expect(obtenerDatos(await service.getAll())).toEqual([])

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
      expect(obtenerDatos(await service.getAll())).toEqual([proyectoCreado])
    })

    test("la fecha de alta es la del momento de la creación, no la del body", async () => {
      const antes = new Date()
      const proyectoCreado = await service.create({
        ...dtoProyectoValido,
        fechaAlta: new Date("2000-01-01"),
      })

      expect(proyectoCreado.fechaAlta >= antes).toBe(true)
      expect(proyectoCreado.fechaAlta <= new Date()).toBe(true)
    })

    test("rechaza un colectivo inexistente sin guardar el proyecto", async () => {
      await expect(
        service.create({
          ...dtoProyectoValido,
          colectivo: "colectivo-inexistente",
        }),
      ).rejects.toThrow(InvalidReference)

      expect(obtenerDatos(await service.getAll())).toHaveLength(0)
    })

    test("lanza AlreadyExists si ya existe un proyecto con el mismo título", async () => {
      await service.create(dtoProyectoValido)

      await expect(
        service.create({
          ...dtoProyectoValido,
          descripcion: "Otra descripción",
        }),
      ).rejects.toThrow(AlreadyExists)

      expect(obtenerDatos(await service.getAll())).toHaveLength(1)
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

  describe("getDelColectivo", () => {
    test("devuelve el proyecto a su colectivo", async () => {
      const creado = await service.create(dtoProyectoValido)

      expect(
        await service.getDelColectivo(creado.id, dtoProyectoValido.colectivo),
      ).toBe(creado)
    })

    test("lanza NoAutorizado si el proyecto es de otro colectivo", async () => {
      const creado = await service.create(dtoProyectoValido)

      await expect(
        service.getDelColectivo(creado.id, "otro-colectivo"),
      ).rejects.toThrow(NoAutorizado)
    })

    test("lanza EntityNotFound si el proyecto no existe", async () => {
      await expect(
        service.getDelColectivo("id-inexistente", dtoProyectoValido.colectivo),
      ).rejects.toThrow(EntityNotFound)
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
      expect(obtenerDatos(await service.getAll())).toHaveLength(1)
    })

    test("permite cambiar el colectivo por otro existente", async () => {
      const creado = await service.create(dtoProyectoValido)
      const colectivo = await colectivoService.create({
        nombre: "Otra organización",
        descripcion: "Proyecto comunitario",
        tipo: "ONG",
      })

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

      expect(obtenerDatos(await service.getAll())).toHaveLength(0)
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
  describe("perfiles del proyecto", () => {
    const nuevoPerfil = (descripcion) =>
      new Perfil({
        descripcion,
        unidadCompromiso: UnidadCompromiso.HORAS_MENSUALES,
        cantidadHoras: 5,
        modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
        habilidadesRequeridas: ["javascript"],
        habilidadesOpcionales: ["docker"],
      })

    const crearConPerfiles = async (titulo, ...descripciones) => {
      const proyecto = await service.create({ ...dtoProyectoValido, titulo })
      for (const descripcion of descripciones) {
        proyecto.perfiles.push(nuevoPerfil(descripcion))
      }
      return await proyectoRepository.save(proyecto)
    }

    // El fake devuelve el mismo objeto que guarda: hace falta una copia profunda
    // para que la comparación de después no sea contra sí mismo.
    const copiaDePerfiles = (proyecto) => structuredClone(proyecto.perfiles)

    test("editar título, descripción y colectivo no toca sus perfiles", async () => {
      const proyecto = await crearConPerfiles(
        "Con perfiles",
        "Tester",
        "Analista",
      )
      const perfilesAntes = copiaDePerfiles(proyecto)
      const otroColectivo = await colectivoService.create({
        nombre: "Otra organización",
        descripcion: "Proyecto comunitario",
        tipo: "ONG",
      })

      await service.update(proyecto.id, {
        titulo: "Título nuevo",
        descripcion: "Descripción nueva",
        colectivo: otroColectivo.id,
      })

      const actualizado = await service.getById(proyecto.id)
      expect(actualizado.titulo).toBe("Título nuevo")
      expect(actualizado.perfiles).toEqual(perfilesAntes)
    })

    test("cerrar el proyecto conserva sus perfiles", async () => {
      const proyecto = await crearConPerfiles("A cerrar", "Tester")
      const perfilesAntes = copiaDePerfiles(proyecto)

      await service.update(proyecto.id, { estado: EstadoProyecto.CERRADO })

      expect((await service.getById(proyecto.id)).perfiles).toEqual(
        perfilesAntes,
      )
    })

    test.each([
      ["un colectivo inexistente", { colectivo: "colectivo-inexistente" }],
      ["un título ya usado", { titulo: "Ocupado" }],
    ])(
      "una edición rechazada por %s no toca sus perfiles",
      async (_caso, cambios) => {
        await service.create({ ...dtoProyectoValido, titulo: "Ocupado" })
        const proyecto = await crearConPerfiles("Con perfiles", "Tester")
        const perfilesAntes = copiaDePerfiles(proyecto)

        await expect(service.update(proyecto.id, cambios)).rejects.toThrow()

        expect((await service.getById(proyecto.id)).perfiles).toEqual(
          perfilesAntes,
        )
      },
    )

    test("borrar un proyecto borra sus perfiles y no toca los de otros proyectos", async () => {
      const borrado = await crearConPerfiles("A borrar", "Tester", "Analista")
      const otro = await crearConPerfiles("Se queda", "Diseñadora")
      const perfilesDelOtro = copiaDePerfiles(otro)

      await service.delete(borrado.id)

      await expect(service.getById(borrado.id)).rejects.toThrow(EntityNotFound)
      const restantes = await service.getAll()
      expect(restantes.data.map((proyecto) => proyecto.id)).toEqual([otro.id])
      expect(restantes.data[0].perfiles).toEqual(perfilesDelOtro)
      expect(await service.getAllByHabilidades(["javascript"])).toEqual([otro])
    })
  })
  describe("getAllByHabilidades", () => {
    const crearConPerfil = async (titulo, habilidadesRequeridas) => {
      const proyecto = await service.create({ ...dtoProyectoValido, titulo })
      proyecto.perfiles.push(
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
