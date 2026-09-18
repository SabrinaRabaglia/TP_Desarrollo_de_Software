import { describe, expect, test, beforeEach } from "@jest/globals"
import ColectivoService from "../../../src/services/ColectivoService.js"
import {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from "../../../src/errors/AppError.js"
import ColectivoRepository from "../../../src/repositories/ColectivoRepository.js"
import TipoColectivoRepository from "../../../src/repositories/TipoColectivoRepository.js"
import ProyectoRepository from "../../../src/repositories/ProyectoRepository.js"
import ProvinciaRepository from "../../../src/repositories/ProvinciaRepository.js"
import PaisRepository from "../../../src/repositories/PaisRepository.js"
import TipoColectivo from "../../../src/domain/TipoColectivo.js"
describe("ColectivoService", () => {

  beforeEach(() => {
    new ColectivoRepository().deleteAll()
  })

  test.each([
    ["tipo desconocido", { tipo: "Tipo inexistente" }],
    ["provincia desconocida", { provincia: "999" }],
  ])(
    "rechaza %s al crear, actualizar y aplicar patch sin modificar datos",
    async (_caso, cambios) => {
      const service = new ColectivoService(
        new ColectivoRepository(),
        new TipoColectivoRepository(),
        new ProyectoRepository(),
        new ProvinciaRepository(),
        new PaisRepository()
      )
      const datos = {
        nombre: "Asamblea Ambiental",
        descripcion: "Descripción",
        tipo: "Asamblea",
        provincia: "2",
      }

      await expect(service.create({ ...datos, ...cambios })).rejects.toThrow(
        UnprocessableEntityError,
      )
      expect(await service.getAll()).toEqual([])

      const colectivo = await service.create(datos)
      const antes = await service.getById(colectivo.id)

      await expect(
        service.update(colectivo.id, { ...datos, ...cambios }),
      ).rejects.toThrow(UnprocessableEntityError)

      expect(await service.getById(colectivo.id)).toEqual(antes)

      await expect(service.patch(colectivo.id, cambios)).rejects.toThrow(
        UnprocessableEntityError,
      )
      expect(await service.getById(colectivo.id)).toEqual(antes)
    },
  )

  test("permite ampliar el catálogo de tipos", async () => {
    const catalogo = new TipoColectivoRepository()
    // Guardamos explícitamente en el catálogo de prueba
    await catalogo.save(new TipoColectivo("Cooperativa"))

    const service = new ColectivoService(
      new ColectivoRepository(),
      catalogo, 
      new ProyectoRepository(),
      new ProvinciaRepository(),
      new PaisRepository()
    )

    const colectivo = await service.create({
      nombre: "Cooperativa del barrio",
      descripcion: "Descripción",
      tipo: "Cooperativa",
    })

    const encontrado = await service.getById(colectivo.id)
    expect(encontrado).toBeDefined()
    expect(encontrado.tipo).toBe("Cooperativa")
  })

  describe("create", () => {
    test("crea y guarda un colectivo cuando el nombre no existe todavia", async () => {
      const service = new ColectivoService(
        new ColectivoRepository(),
        new TipoColectivoRepository(),
        new ProyectoRepository(),
        new ProvinciaRepository(),
        new PaisRepository()
      )
      const nueva = {
        nombre: "Asamblea Ambiental",
        descripcion: "Protección de humedales locales",
        tipo: "asamblea",
        provincia: "6",
      }
      const colectivoCreado = await service.create(nueva)

      expect(colectivoCreado.nombre).toBe(nueva.nombre)
      expect(colectivoCreado.descripcion).toBe(nueva.descripcion)
      expect(colectivoCreado.tipo).toBe(nueva.tipo)
      expect(colectivoCreado.provincia.id).toBe("6")
      expect(await service.getAll()).toHaveLength(1)
    })

    test("tira ConflictError si ya existe un colectivo con el mismo nombre", async () => {
      const service = new ColectivoService(
        new ColectivoRepository(),
        new TipoColectivoRepository(),
        new ProyectoRepository(),
        new ProvinciaRepository(),
        new PaisRepository()
      )

      await service.create({
        nombre: "Asamblea Ambiental",
        descripcion: "Protección de humedales locales",
        tipo: "Asamblea",
      })

      await expect(
        service.create({
          nombre: "Asamblea Ambiental",
          descripcion: "Otra descripción distinta",
          tipo: "ONG",
        })
      ).rejects.toThrow(ConflictError)

      expect(await service.getAll()).toHaveLength(1)
    })

    describe("getById", () => {
      test("devuelve el colectivo correspondiente cuando se encuentra por ID", async () => {
        const service = new ColectivoService(
          new ColectivoRepository(),
          new TipoColectivoRepository(),
          new ProyectoRepository(),
          new ProvinciaRepository(),
          new PaisRepository()
        )
        const colectivoCreado = await service.create({
          nombre: "Asamblea Ambiental",
          descripcion: "Protección de humedales locales",
          tipo: "Asamblea",
        })

        const colectivoEncontrado = await service.getById(colectivoCreado.id)

        expect(colectivoEncontrado).toBeDefined()
        expect(colectivoEncontrado.id).toBe(colectivoCreado.id)
        expect(colectivoEncontrado.nombre).toBe("Asamblea Ambiental")
      })

      test("lanza NotFoundError si el colectivo no existe", async () => {
        const service = new ColectivoService(
          new ColectivoRepository(),
          new TipoColectivoRepository(),
          new ProyectoRepository(),
          new ProvinciaRepository(),
          new PaisRepository()
        )

        await expect(service.getById("id-inexistente")).rejects.toThrow(NotFoundError)
      })
    })

    describe("update", () => {
      test("rechaza un nombre vacío en una actualización parcial sin modificar el colectivo", async () => {
        const service = new ColectivoService(
          new ColectivoRepository(),
          new TipoColectivoRepository(),
          new ProyectoRepository(),
          new ProvinciaRepository(),
          new PaisRepository()
        )
        const colectivo = await service.create({
          nombre: "Asamblea Ambiental",
          descripcion: "Descripción original",
          tipo: "Asamblea",
        })
        const antes = await service.getById(colectivo.id)

        await expect(
          service.patch(colectivo.id, {
            nombre: "",
            descripcion: "No debe guardarse",
          }),
        ).rejects.toThrow()

        expect(await service.getById(colectivo.id)).toEqual(antes)
      })

      test("lanza NotFoundError si intenta actualizar un colectivo inexistente", async () => {
        const service = new ColectivoService(
          new ColectivoRepository(),
          new TipoColectivoRepository(),
          new ProyectoRepository(),
          new ProvinciaRepository(),
          new PaisRepository()
        )
        const datos = { nombre: "Nuevo", descripcion: "Desc", tipo: "ONG" }

        await expect(service.update("id-inexistente", datos)).rejects.toThrow(
          NotFoundError,
        )
      })
    })

    describe("delete", () => {
      test("elimina el colectivo correctamente si existe", async () => {
        const service = new ColectivoService(
          new ColectivoRepository(),
          new TipoColectivoRepository(),
          new ProyectoRepository(),
          new ProvinciaRepository(),
          new PaisRepository()
        )
        const colectivo = await service.create({
          nombre: "Asamblea Ambiental",
          descripcion: "Protección de humedales locales",
          tipo: "Asamblea",
        })

        await service.delete(colectivo.id)

        expect(await service.getAll()).toHaveLength(0)
      })
    })
  })
})