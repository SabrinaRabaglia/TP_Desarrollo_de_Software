import { beforeEach, describe, expect, test } from "@jest/globals"
import ProyectoService from "../../../src/services/ProyectoService.js"
import ProyectoRepository from "../../fakes/ProyectoRepository.js"
import ColectivoService from "../../../src/services/ColectivoService.js"
import ColectivoRepository from "../../fakes/ColectivoRepository.js"
import TipoColectivoRepository from "../../fakes/TipoColectivoRepository.js"
import ProvinciaRepository from "../../fakes/ProvinciaRepository.js"
import PaisRepository from "../../fakes/PaisRepository.js"
import HabilidadService from "../../../src/services/HabilidadService.js"
import HabilidadRepository from "../../fakes/HabilidadRepository.js"
import ColaboracionRepository from "../../fakes/ColaboracionRepository.js"
import {
  AlreadyExists,
  EntityNotFound,
  InvalidReference,
} from "../../../src/errors/ApplicationErrors.js"
import { DomainValidationError, DomainRuleError } from "../../../src/domain/errors/DomainErrors.js"
import { EstadoProyecto } from "../../../src/domain/enums/EstadoProyecto.js"
import { ModalidadColaboracion } from "../../../src/domain/enums/ModalidadColaboracion.js"
import { UnidadCompromiso } from "../../../src/domain/enums/UnidadCompromiso.js"

describe("ProyectoService", () => {
  let service
  let colectivoService
  let habilidadService
  let proyectoRepository
  let colaboracionRepository
  let dtoProyectoValido

  beforeEach(async () => {
    proyectoRepository = new ProyectoRepository()
    const colectivoRepository = new ColectivoRepository()
    const tipoColectivoRepository = new TipoColectivoRepository()
    const habilidadRepository = new HabilidadRepository()

    proyectoRepository.deleteAll()
    colectivoRepository.deleteAll()
    habilidadRepository.deleteAll()

    colectivoService = new ColectivoService(
      colectivoRepository,
      tipoColectivoRepository,
      proyectoRepository,
      new ProvinciaRepository(),
      new PaisRepository(),
    )
    habilidadService = new HabilidadService(habilidadRepository)
    colaboracionRepository = new ColaboracionRepository()
    service = new ProyectoService(
      proyectoRepository,
      colectivoService,
      habilidadService,
      colaboracionRepository,
    )

    const colectivo = await colectivoService.create({
      nombre: "Asamblea Ambiental",
      descripcion: "Protección de humedales",
      tipo: "Asamblea",
    })
    
    const habilidades = []
    for (const titulo of ["JavaScript", "Node"]) {
      const h = await habilidadService.create({
        titulo,
        codigo: titulo.toLowerCase(),
        descripcion: titulo,
      })
      habilidades.push(h)
    }

    dtoProyectoValido = {
      titulo: "Plataforma de Colaboración",
      descripcion: "Plataforma para conectar colectivos sociales",
      unidadCompromiso: UnidadCompromiso.HORAS_SEMANALES,
      cantHoras: 10,
      colectivo: colectivo.id,
      modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
      habilidadesRequeridas: habilidades.map((habilidad) => habilidad.id),
      estado: EstadoProyecto.PUBLICADO,
    }
  })

  test("los colectivos reflejan el alta, traslado y eliminación de sus proyectos", async () => {
    const origenId = dtoProyectoValido.colectivo
    const destino = await colectivoService.create({
      nombre: "Otro colectivo",
      descripcion: "Descripción",
      tipo: "ONG",
    })
    const proyecto = await service.create(dtoProyectoValido)

    const colectivoOrigen = await colectivoService.getById(origenId)
expect(colectivoOrigen.proyectos).toEqual([proyecto])
    expect((await colectivoService.getById(destino.id)).proyectos).toEqual([])
    expect(
      (await colectivoService.getAll()).find((c) => c.id === origenId).proyectos,
    ).toEqual([proyecto])

    await service.update(proyecto.id, { colectivo: destino.id })

    expect((await colectivoService.getById(origenId)).proyectos).toEqual([])
    expect((await colectivoService.getById(destino.id)).proyectos).toEqual([proyecto])
    
    const actualizado = await colectivoService.patch(destino.id, {
      descripcion: "Nueva descripción",
    })
    expect(actualizado.proyectos).toEqual([proyecto])
    
    const respuesta = JSON.parse(JSON.stringify(await colectivoService.getAll()))
    expect(
      respuesta.find((c) => c.id === destino.id).proyectos[0].colectivo,
    ).toBe(destino.id)

    await service.delete(proyecto.id)

    expect((await colectivoService.getById(destino.id)).proyectos).toEqual([])
    expect(
      (await colectivoService.getAll()).every((c) => c.proyectos.length === 0),
    ).toBe(true)
  })

  test.each([
    ["horas negativas", { cantHoras: -1 }],
    ["modalidades vacías", { modalidadesColaboracion: [] }],
  ])(
    "rechaza %s al crear y actualizar sin alterar los datos",
    async (_caso, cambios) => {
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
    },
  )

  describe("create", () => {
    test("crea y guarda un proyecto cuando el título no existe todavía", async () => {
      const proyectoCreado = await service.create(dtoProyectoValido)

      expect(proyectoCreado.titulo).toBe(dtoProyectoValido.titulo)
      expect(proyectoCreado.descripcion).toBe(dtoProyectoValido.descripcion)
      expect(proyectoCreado.cantHoras).toBe(dtoProyectoValido.cantHoras)
      expect(proyectoCreado.colectivo).toBe(dtoProyectoValido.colectivo)
      expect(proyectoCreado.habilidadesRequeridas).toEqual(
        dtoProyectoValido.habilidadesRequeridas,
      )
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

    test("rechaza una habilidad inexistente aunque las anteriores existan", async () => {
      await expect(
        service.create({
          ...dtoProyectoValido,
          habilidadesRequeridas: [
            dtoProyectoValido.habilidadesRequeridas[0],
            "habilidad-inexistente",
          ],
        }),
      ).rejects.toThrow(InvalidReference)

      expect(await service.getAll()).toHaveLength(0)
    })

    test("permite crear un proyecto sin habilidades requeridas", async () => {
      const creado = await service.create({
        ...dtoProyectoValido,
        habilidadesRequeridas: [],
      })

      expect((await service.getById(creado.id)).habilidadesRequeridas).toEqual([])
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
      await expect(service.getById("id-inexistente")).rejects.toThrow(EntityNotFound)
    })
  })

  describe("update", () => {
    test("rechaza cero horas sin modificar el proyecto", async () => {
      const proyecto = await service.create(dtoProyectoValido)
      const antes = { ...proyecto }

      await expect(
        service.update(proyecto.id, {
          titulo: "No debe guardarse",
          cantHoras: 0,
        }),
      ).rejects.toThrow(DomainValidationError)

      expect(await service.getById(proyecto.id)).toEqual(antes)
    })

    test("actualiza un proyecto existente correctamente", async () => {
      const creado = await service.create(dtoProyectoValido)

      const actualizado = await service.update(creado.id, {
        titulo: "Nuevo Título",
        cantHoras: 20,
      })

      expect(actualizado.titulo).toBe("Nuevo Título")
      expect(actualizado.cantHoras).toBe(20)
      expect(actualizado.colectivo).toBe(dtoProyectoValido.colectivo)
      expect(actualizado.habilidadesRequeridas).toEqual(
        dtoProyectoValido.habilidadesRequeridas,
      )
    })

    test.each([
      ["colectivo", { colectivo: "colectivo-inexistente" }],
      ["habilidad", { habilidadesRequeridas: ["habilidad-inexistente"] }],
    ])(
      "rechaza un cambio con %s inexistente sin modificar ningún campo",
      async (_tipo, cambios) => {
        const creado = await service.create(dtoProyectoValido)
        const antes = { ...creado }

        await expect(
          service.update(creado.id, {
            titulo: "Este título no debe guardarse",
            cantHoras: 20,
            ...cambios,
          }),
        ).rejects.toThrow(InvalidReference)

        expect(await service.getById(creado.id)).toEqual(antes)
        expect(await service.getAll()).toHaveLength(1)
      },
    )

    test("permite cambiar el colectivo y las habilidades por otros existentes", async () => {
      const creado = await service.create(dtoProyectoValido)
      const colectivo = await colectivoService.create({
        nombre: "Otra organización",
        descripcion: "Proyecto comunitario",
        tipo: "ONG",
      })
      const habilidad = await habilidadService.create({
        titulo: "React",
        codigo: "react",
        descripcion: "Desarrollo web",
      })

      await service.update(creado.id, {
        colectivo: colectivo.id,
        habilidadesRequeridas: [habilidad.id],
      })

      const actualizado = await service.getById(creado.id)
      expect(actualizado.colectivo).toBe(colectivo.id)
      expect(actualizado.habilidadesRequeridas).toEqual([habilidad.id])
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
      await colaboracionRepository.save({ personaColaboradora: persona, proyecto: { id: creado.id } })
      await colaboracionRepository.save({ personaColaboradora: persona, proyecto: { id: "otro-proyecto" } })

      await service.delete(creado.id)

      expect(await colaboracionRepository.getAll()).toEqual([
        { personaColaboradora: persona, proyecto: { id: "otro-proyecto" } },
      ])
    })

    test("lanza EntityNotFound al intentar eliminar un proyecto inexistente", async () => {
      await expect(service.delete("id-inexistente")).rejects.toThrow(EntityNotFound)
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
})