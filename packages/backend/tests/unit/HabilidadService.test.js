import { describe, expect, test } from "@jest/globals"
import HabilidadService from "../../src/services/HabilidadService.js"
import HabilidadRepository from "../../src/repositories/HabilidadRepository.js"
import { ConflictError, NotFoundError } from "../../src/errors/AppError.js"

describe("HabilidadService", () => {
  describe("create", () => {
    test("crea y guarda una habilidad cuando el código no existe todavía", () => {
      const service = new HabilidadService(new HabilidadRepository())
      const nueva = { titulo: "React", codigo: "react", descripcion: "desc" }
      const habilidad = service.create(nueva)

      expect(habilidad.titulo).toBe(nueva.titulo)
      expect(habilidad.codigo).toBe(nueva.codigo)
      expect(habilidad.descripcion).toBe(nueva.descripcion)
      expect(service.getAll()).toEqual([habilidad])
    })

    test("tira ConflictError si ya existe una habilidad con el mismo código", () => {
      const service = new HabilidadService(new HabilidadRepository())
      service.create({ titulo: "React", codigo: "react", descripcion: "desc" })
      const crearHabilidadConCodigoRepetido = () =>
        service.create({ titulo: "React de nuevo", codigo: "react", descripcion: "otra desc" })

      expect(crearHabilidadConCodigoRepetido).toThrow(ConflictError)
      expect(service.getAll()).toHaveLength(1)
    })
  })

  describe("update", () => {
    test("actualiza los datos de una habilidad existente, conservando su id", () => {
      const service = new HabilidadService(new HabilidadRepository())
      const habilidad = service.create({ titulo: "React", codigo: "react", descripcion: "desc" })
      const actualizada = service.update(habilidad.id, {
        titulo: "React actualizado",
        codigo: "react",
        descripcion: "nueva desc",
      })

      expect(actualizada.id).toBe(habilidad.id)
      expect(actualizada.titulo).toBe("React actualizado")
      expect(actualizada.descripcion).toBe("nueva desc")
    })

    test("tira NotFoundError si el id no corresponde a ninguna habilidad", () => {
      const service = new HabilidadService(new HabilidadRepository())
      const actualizarHabilidadInexistente = () =>
        service.update("id-inexistente", { titulo: "x", codigo: "y", descripcion: "z" })

      expect(actualizarHabilidadInexistente).toThrow(NotFoundError)
    })

    test("tira ConflictError si el nuevo código pertenece a OTRA habilidad existente", () => {
      const service = new HabilidadService(new HabilidadRepository())
      const react = service.create({ titulo: "React", codigo: "react", descripcion: "desc" })
      service.create({ titulo: "Node", codigo: "node", descripcion: "desc" })

      const actualizarConCodigoDeOtra = () =>
        service.update(react.id, { titulo: "React", codigo: "node", descripcion: "desc" })

      expect(actualizarConCodigoDeOtra).toThrow(ConflictError)
    })

    test("permite actualizar una habilidad conservando su propio código (no es conflicto consigo misma)", () => {
      const service = new HabilidadService(new HabilidadRepository())
      const habilidad = service.create({ titulo: "React", codigo: "react", descripcion: "desc" })

      const actualizada = service.update(habilidad.id, {
        titulo: "React (nuevo título)",
        codigo: "react",
        descripcion: "desc",
      })

      expect(actualizada.codigo).toBe("react")
      expect(actualizada.titulo).toBe("React (nuevo título)")
    })
  })

  describe("delete", () => {
    test("elimina una habilidad existente", () => {
      const service = new HabilidadService(new HabilidadRepository())
      const habilidad = service.create({ titulo: "React", codigo: "react", descripcion: "desc" })

      service.delete(habilidad.id)

      expect(service.getAll()).toEqual([])
    })

    test("tira NotFoundError si el id no corresponde a ninguna habilidad", () => {
      const service = new HabilidadService(new HabilidadRepository())
      const borrarHabilidadInexistente = () => service.delete("id-inexistente")

      expect(borrarHabilidadInexistente).toThrow(NotFoundError)
    })
  })

  describe("getById", () => {
    test("devuelve la habilidad correcta cuando existe", () => {
      const service = new HabilidadService(new HabilidadRepository())
      const habilidad = service.create({ titulo: "React", codigo: "react", descripcion: "desc" })

      const encontrada = service.getById(habilidad.id)

      expect(encontrada).toBe(habilidad)
    })

    test("tira NotFoundError si el id no corresponde a ninguna habilidad", () => {
      const service = new HabilidadService(new HabilidadRepository())
      const buscarHabilidadInexistente = () => service.getById("id-inexistente")

      expect(buscarHabilidadInexistente).toThrow(NotFoundError)
    })
  })

  describe("getAll", () => {
    test("devuelve todas las habilidades guardadas", () => {
      const service = new HabilidadService(new HabilidadRepository())
      const react = service.create({ titulo: "React", codigo: "react", descripcion: "desc" })
      const node = service.create({ titulo: "Node", codigo: "node", descripcion: "desc" })

      const habilidades = service.getAll()

      expect(habilidades).toEqual([react, node])
    })
  })
})