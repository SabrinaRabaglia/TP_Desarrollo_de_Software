import { describe, expect, test, beforeEach } from "@jest/globals"
import HabilidadService from "../../../src/services/HabilidadService.js"
import HabilidadRepository from "../../fakes/HabilidadRepository.js"
import PersonaColaboradoraRepository from "../../fakes/PersonaColaboradoraRepository.js"
import ProyectoRepository from "../../fakes/ProyectoRepository.js"
import { AlreadyExists, EntityInUse, EntityNotFound } from "../../../src/errors/ApplicationErrors.js"
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
    const crearServicio = () =>
      new HabilidadService(
        new HabilidadRepository(),
        new PersonaColaboradoraRepository(),
        new ProyectoRepository(),
      )
    const crearReact = (service) =>
      service.create({ titulo: "React", codigo: "react", descripcion: "desc" })
    const proyectoConPerfil = (perfil) => ({
      perfiles: [
        { habilidadesRequeridas: [], habilidadesOpcionales: [], ...perfil },
      ],
    })

    beforeEach(() => {
      new PersonaColaboradoraRepository().deleteAll()
      new ProyectoRepository().deleteAll()
    })

    test("elimina una habilidad que nadie usa", async () => {
      const service = crearServicio()
      const habilidad = await crearReact(service)

      await service.delete(habilidad.id)

      expect(await service.getAll()).toEqual([])
    })

    test("tira EntityNotFound si el id no corresponde a ninguna habilidad", async () => {
      const service = crearServicio()

      await expect(service.delete("id-inexistente")).rejects.toThrow(EntityNotFound)
    })

    test("tira EntityInUse y no la borra si una persona colaboradora la tiene", async () => {
      const service = crearServicio()
      const habilidad = await crearReact(service)
      await new PersonaColaboradoraRepository().save({ habilidades: [habilidad] })

      await expect(service.delete(habilidad.id)).rejects.toThrow(EntityInUse)
      expect(await service.getAll()).toEqual([habilidad])
    })

    test("tira EntityInUse y no la borra si un perfil la requiere", async () => {
      const service = crearServicio()
      const habilidad = await crearReact(service)
      await new ProyectoRepository().save(
        proyectoConPerfil({ habilidadesRequeridas: [habilidad] }),
      )

      await expect(service.delete(habilidad.id)).rejects.toThrow(EntityInUse)
      expect(await service.getAll()).toEqual([habilidad])
    })

    test("tira EntityInUse y no la borra si un perfil la tiene como opcional", async () => {
      const service = crearServicio()
      const habilidad = await crearReact(service)
      await new ProyectoRepository().save(
        proyectoConPerfil({ habilidadesOpcionales: [habilidad] }),
      )

      await expect(service.delete(habilidad.id)).rejects.toThrow(EntityInUse)
      expect(await service.getAll()).toEqual([habilidad])
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