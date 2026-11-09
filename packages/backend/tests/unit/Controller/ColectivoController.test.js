import { describe, expect, test, jest } from "@jest/globals"
import ColectivoController from "../../../src/controllers/ColectivoController.js"

const guardado = (colectivo) => ({ id: "1", ...colectivo, proyectos: [] })

const PAIS_ID = "65f1a2b3c4d5e6f708192a01"
const PROVINCIA_ID = "65f1a2b3c4d5e6f708192a02"

const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
})

const mockColectivoService = () => ({
  create: jest.fn(),
  update: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  getById: jest.fn(),
  getAll: jest.fn(),
})

describe("ColectivoController", () => {
  describe("getAll", () => {
    test("responde con 200 y la lista de colectivos que devuelve el service", async () => {
      const colectivoServiceMock = mockColectivoService()
      const lista = [guardado({ nombre: "Asamblea Ambiental" })]
      colectivoServiceMock.getAll.mockReturnValue(lista)

      const controller = new ColectivoController(colectivoServiceMock)
      const req = {}
      const res = mockRes()
      const next = jest.fn()

      await controller.getAll(req, res, next)

      expect(colectivoServiceMock.getAll).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(lista)
    })
  })

  describe("getById", () => {
    test("responde con 200 y el colectivo obtenido según el id", async () => {
      const colectivoServiceMock = mockColectivoService()
      const colectivo = guardado({ nombre: "Asamblea Ambiental" })
      colectivoServiceMock.getById.mockReturnValue(colectivo)

      const controller = new ColectivoController(colectivoServiceMock)
      const req = { params: { id: "1" } }
      const res = mockRes()
      const next = jest.fn()

      await controller.getById(req, res, next)

      expect(colectivoServiceMock.getById).toHaveBeenCalledWith("1")
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(colectivo)
    })
  })

  describe("create", () => {
    test("con body válido, delega en el service y responde con 201 el colectivo creado", async () => {
      const body = {
        nombre: "Asamblea Ambiental del Sur",
        descripcion:
          "Grupo autoconvocado para la protección de la cuenca y humedales locales.",
        tipo: "asamblea",
        pais: PAIS_ID,
        provincia: PROVINCIA_ID,
        ciudad: "Almagro",
      }
      const colectivoCreado = guardado(body)
      const colectivoServiceMock = mockColectivoService()
      colectivoServiceMock.create.mockReturnValue(colectivoCreado)
      const controller = new ColectivoController(colectivoServiceMock)
      const req = { body }
      const res = mockRes()
      const next = jest.fn()

      await controller.create(req, res, next)

      expect(colectivoServiceMock.create).toHaveBeenCalledWith(body)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(colectivoCreado)
    })
  })

  describe("update", () => {
    test("con body válido actualiza el colectivo y responde con 200", async () => {
      const colectivoServiceMock = mockColectivoService()
      const controller = new ColectivoController(colectivoServiceMock)
      const body = {
        nombre: "Asamblea Ambiental del Sur",
        descripcion:
          "Nueva descripción con objetivos ampliados para el barrio.",
        tipo: "asamblea",
        pais: PAIS_ID,
        provincia: PROVINCIA_ID,
        ciudad: "Palermo",
      }
      const req = { params: { id: "1" }, body }
      const colectivoGuardado = guardado(body)
      colectivoServiceMock.update.mockReturnValue(colectivoGuardado)
      const res = mockRes()
      const next = jest.fn()

      await controller.update(req, res, next)

      expect(colectivoServiceMock.update).toHaveBeenCalledWith("1", body)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(colectivoGuardado)
    })
  })

  describe("patch", () => {
    test("con actualización parcial válida delega en el service y responde con 200", async () => {
      const colectivoServiceMock = mockColectivoService()
      const actualizado = guardado({ nombre: "Nuevo Nombre" })
      colectivoServiceMock.patch.mockReturnValue(actualizado)

      const controller = new ColectivoController(colectivoServiceMock)
      const req = { params: { id: "1" }, body: { nombre: "Nuevo Nombre" } }
      const res = mockRes()
      const next = jest.fn()

      await controller.patch(req, res, next)

      expect(colectivoServiceMock.patch).toHaveBeenCalledWith("1", {
        nombre: "Nuevo Nombre",
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(actualizado)
    })
  })

  describe("delete", () => {
    test("llama al delete del service y responde con 204", async () => {
      const colectivoServiceMock = mockColectivoService()
      const controller = new ColectivoController(colectivoServiceMock)
      const req = { params: { id: "1" } }
      const res = mockRes()
      const next = jest.fn()

      await controller.delete(req, res, next)

      expect(colectivoServiceMock.delete).toHaveBeenCalledWith("1")
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalled()
    })
  })
})
