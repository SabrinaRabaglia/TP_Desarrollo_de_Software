import { beforeEach, describe, expect, test } from "@jest/globals"
import ProyectoService from "../../../src/services/ProyectoService.js"
import ProyectoRepository from "../../../src/repositories/ProyectoRepository.js"
import ColectivoService from "../../../src/services/ColectivoService.js"
import ColectivoRepository from "../../../src/repositories/ColectivoRepository.js"
import TipoColectivoRepository from "../../../src/repositories/TipoColectivoRepository.js"
import HabilidadService from "../../../src/services/HabilidadService.js"
import HabilidadRepository from "../../../src/repositories/HabilidadRepository.js"
import {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from "../../../src/errors/AppError.js"
import { EstadoProyecto } from "../../../src/domain/enums/EstadoProyecto.js"
import { ModalidadColaboracion } from "../../../src/domain/enums/ModalidadColaboracion.js"
import { UnidadCompromiso } from "../../../src/domain/enums/UnidadCompromiso.js"

describe("ProyectoService", () => {
  let service
  let colectivoService
  let habilidadService
  let dtoProyectoValido

  beforeEach(() => {
    const proyectoRepository = new ProyectoRepository()
    colectivoService = new ColectivoService(
      new ColectivoRepository(),
      new TipoColectivoRepository(),
      proyectoRepository,
    )
    habilidadService = new HabilidadService(new HabilidadRepository())
    service = new ProyectoService(
      proyectoRepository,
      colectivoService,
      habilidadService,
    )
    const colectivo = colectivoService.create({
      nombre: "Asamblea Ambiental",
      descripcion: "Protección de humedales",
      tipo: "Asamblea",
    })
    const habilidades = ["JavaScript", "Node"].map((titulo) =>
      habilidadService.create({
        titulo,
        codigo: titulo.toLowerCase(),
        descripcion: titulo,
      }),
    )

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

  test("los colectivos reflejan el alta, traslado y eliminación de sus proyectos", () => {
    const origenId = dtoProyectoValido.colectivo
    const destino = colectivoService.create({
      nombre: "Otro colectivo",
      descripcion: "Descripción",
      tipo: "ONG",
    })
    const proyecto = service.create(dtoProyectoValido)

    expect(colectivoService.getById(origenId).proyectos).toEqual([proyecto])
    expect(colectivoService.getById(destino.id).proyectos).toEqual([])
    expect(
      colectivoService.getAll().find((c) => c.id === origenId).proyectos,
    ).toEqual([proyecto])

    service.update(proyecto.id, { colectivo: destino.id })

    expect(colectivoService.getById(origenId).proyectos).toEqual([])
    expect(colectivoService.getById(destino.id).proyectos).toEqual([proyecto])
    const actualizado = colectivoService.patch(destino.id, {
      descripcion: "Nueva descripción",
    })
    expect(actualizado.proyectos).toEqual([proyecto])
    const respuesta = JSON.parse(JSON.stringify(colectivoService.getAll()))
    expect(
      respuesta.find((c) => c.id === destino.id).proyectos[0].colectivo,
    ).toBe(destino.id)

    service.delete(proyecto.id)

    expect(colectivoService.getById(destino.id).proyectos).toEqual([])
    expect(
      colectivoService.getAll().every((c) => c.proyectos.length === 0),
    ).toBe(true)
  })

  test.each([
    ["horas negativas", { cantHoras: -1 }],
    ["modalidades vacías", { modalidadesColaboracion: [] }],
  ])(
    "rechaza %s al crear y actualizar sin alterar los datos",
    (_caso, cambios) => {
      expect(() =>
        service.create({ ...dtoProyectoValido, ...cambios }),
      ).toThrow(UnprocessableEntityError)
      expect(service.getAll()).toEqual([])

      const proyecto = service.create(dtoProyectoValido)
      const antes = structuredClone(proyecto)

      expect(() =>
        service.update(proyecto.id, {
          titulo: "No debe guardarse",
          ...cambios,
        }),
      ).toThrow(UnprocessableEntityError)
      expect(service.getById(proyecto.id)).toEqual(antes)
    },
  )

  describe("create", () => {
    test("crea y guarda un proyecto cuando el título no existe todavía", () => {
      const proyectoCreado = service.create(dtoProyectoValido)

      expect(proyectoCreado.titulo).toBe(dtoProyectoValido.titulo)
      expect(proyectoCreado.descripcion).toBe(dtoProyectoValido.descripcion)
      expect(proyectoCreado.cantHoras).toBe(dtoProyectoValido.cantHoras)
      expect(proyectoCreado.colectivo).toBe(dtoProyectoValido.colectivo)
      expect(proyectoCreado.habilidadesRequeridas).toEqual(
        dtoProyectoValido.habilidadesRequeridas,
      )
      expect(service.getAll()).toEqual([proyectoCreado])
    })

    test("rechaza un colectivo inexistente sin guardar el proyecto", () => {
      expect(() =>
        service.create({
          ...dtoProyectoValido,
          colectivo: "colectivo-inexistente",
        }),
      ).toThrow(NotFoundError)

      expect(service.getAll()).toHaveLength(0)
    })

    test("rechaza una habilidad inexistente aunque las anteriores existan", () => {
      expect(() =>
        service.create({
          ...dtoProyectoValido,
          habilidadesRequeridas: [
            dtoProyectoValido.habilidadesRequeridas[0],
            "habilidad-inexistente",
          ],
        }),
      ).toThrow(NotFoundError)

      expect(service.getAll()).toHaveLength(0)
    })

    test("permite crear un proyecto sin habilidades requeridas", () => {
      const creado = service.create({
        ...dtoProyectoValido,
        habilidadesRequeridas: [],
      })

      expect(service.getById(creado.id).habilidadesRequeridas).toEqual([])
    })

    test("tira ConflictError si ya existe un proyecto con el mismo título", () => {
      service.create(dtoProyectoValido)

      const crearDuplicado = () =>
        service.create({
          ...dtoProyectoValido,
          descripcion: "Otra descripción",
        })

      expect(crearDuplicado).toThrow(ConflictError)
      expect(service.getAll()).toHaveLength(1)
    })
  })

  describe("getById", () => {
    test("devuelve el proyecto correspondiente cuando se encuentra por ID", () => {
      const creado = service.create(dtoProyectoValido)

      const encontrado = service.getById(creado.id)

      expect(encontrado).toBeDefined()
      expect(encontrado.id).toBe(creado.id)
      expect(encontrado.titulo).toBe(dtoProyectoValido.titulo)
    })

    test("lanza NotFoundError si el proyecto no existe", () => {
      expect(() => service.getById("id-inexistente")).toThrow(NotFoundError)
    })
  })

  describe("update", () => {
    test("rechaza cero horas sin modificar el proyecto", () => {
      const proyecto = service.create(dtoProyectoValido)
      const antes = structuredClone(proyecto)

      expect(() =>
        service.update(proyecto.id, {
          titulo: "No debe guardarse",
          cantHoras: 0,
        }),
      ).toThrow(UnprocessableEntityError)

      expect(service.getById(proyecto.id)).toEqual(antes)
    })

    test("actualiza un proyecto existente correctamente", () => {
      const creado = service.create(dtoProyectoValido)

      const actualizado = service.update(creado.id, {
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
      (_tipo, cambios) => {
        const creado = service.create(dtoProyectoValido)
        const antes = structuredClone(creado)

        expect(() =>
          service.update(creado.id, {
            titulo: "Este título no debe guardarse",
            cantHoras: 20,
            ...cambios,
          }),
        ).toThrow(NotFoundError)

        expect(service.getById(creado.id)).toEqual(antes)
        expect(service.getAll()).toHaveLength(1)
      },
    )

    test("permite cambiar el colectivo y las habilidades por otros existentes", () => {
      const creado = service.create(dtoProyectoValido)
      const colectivo = colectivoService.create({
        nombre: "Otra organización",
        descripcion: "Proyecto comunitario",
        tipo: "ONG",
      })
      const habilidad = habilidadService.create({
        titulo: "React",
        codigo: "react",
        descripcion: "Desarrollo web",
      })

      service.update(creado.id, {
        colectivo: colectivo.id,
        habilidadesRequeridas: [habilidad.id],
      })

      const actualizado = service.getById(creado.id)
      expect(actualizado.colectivo).toBe(colectivo.id)
      expect(actualizado.habilidadesRequeridas).toEqual([habilidad.id])
    })

    test("lanza NotFoundError si intenta actualizar un proyecto inexistente", () => {
      expect(() =>
        service.update("id-inexistente", { titulo: "Nuevo" }),
      ).toThrow(NotFoundError)
    })
  })

  describe("delete", () => {
    test("elimina el proyecto correctamente si existe", () => {
      const creado = service.create(dtoProyectoValido)

      service.delete(creado.id)

      expect(service.getAll()).toHaveLength(0)
    })

    test("lanza NotFoundError al intentar eliminar un proyecto inexistente", () => {
      expect(() => service.delete("id-inexistente")).toThrow(NotFoundError)
    })
  })
  describe("cerrarProyecto", () => {
    test("cierra y guarda el proyecto actualizando su estado y fecha", () => {
      const creado = service.create(dtoProyectoValido)

      const cerrado = service.cerrarProyecto(creado.id)

      expect(cerrado.estado).toBe(EstadoProyecto.CERRADO)
      expect(cerrado.fechaCierre).toBeInstanceOf(Date)
      expect(service.getById(creado.id)).toBe(cerrado)
    })

    test("lanza NotFoundError si el proyecto no existe", () => {
      expect(() => service.cerrarProyecto("id-inexistente")).toThrow(
        NotFoundError,
      )
    })

    test("rechaza un segundo cierre sin alterar la fecha", () => {
      const creado = service.create(dtoProyectoValido)
      const cerrado = service.cerrarProyecto(creado.id)
      const fechaCierre = cerrado.fechaCierre

      expect(() => service.cerrarProyecto(creado.id)).toThrow(ConflictError)
      expect(service.getById(creado.id).fechaCierre).toBe(fechaCierre)
    })

    test("rechaza reabrir un proyecto sin aplicar cambios parciales", () => {
      const creado = service.create(dtoProyectoValido)
      service.cerrarProyecto(creado.id)
      const antes = structuredClone(creado)

      expect(() =>
        service.update(creado.id, {
          titulo: "No debe guardarse",
          estado: EstadoProyecto.PUBLICADO,
          fechaCierre: null,
        }),
      ).toThrow(ConflictError)
      expect(service.getById(creado.id)).toEqual(antes)

      const editado = service.update(creado.id, {
        descripcion: "Descripción actualizada",
      })
      expect(editado.estado).toBe(EstadoProyecto.CERRADO)
      expect(editado.fechaCierre).toEqual(antes.fechaCierre)
    })
  })
})
