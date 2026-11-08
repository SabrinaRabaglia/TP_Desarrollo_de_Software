import { describe, expect, test, jest } from "@jest/globals"
import PersonaColaboradoraController from "../../../src/controllers/PersonaColaboradoraController.js"

const OBJECT_ID_VALIDO = "65f1a2b3c4d5e6f708192a3b"

const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
})

const mockPersonaColaboradoraService = () => ({
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getById: jest.fn(),
  getAll: jest.fn(),
})

describe("PersonaColaboradoraController", () => {
  describe("create", () => {
    test("con body válido (solo nombreFantasia), delega en el service y responde 201", async () => {
      const personaCreada = {
        id: "1",
        nombreFantasia: "anon123",
        mediosDeContacto: [],
      }
      const service = mockPersonaColaboradoraService()
      service.create.mockReturnValue(personaCreada)
      const controller = new PersonaColaboradoraController(service)
      const req = { body: { nombreFantasia: "anon123", mediosDeContacto: [] } }
      const res = mockRes()
      const next = jest.fn()

      await controller.create(req, res, next)

      expect(service.create).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(personaCreada)
    })

    test("con body válido incluyendo cuentas y habilidades (id con formato ObjectId), delega en el service", async () => {
      const service = mockPersonaColaboradoraService()
      service.create.mockReturnValue({ id: "1" })
      const controller = new PersonaColaboradoraController(service)
      const req = {
        body: {
          nombreFantasia: "anon123",
          habilidades: [OBJECT_ID_VALIDO],
          cuentas: [{ nombreUsuario: "anagomez", tipo: "GITHUB" }],
        },
      }
      const res = mockRes()
      const next = jest.fn()

      await controller.create(req, res, next)

      expect(service.create).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(201)
    })

    test("con body válido incluyendo aceptaMensajeriaInterna y mediosDeContacto, delega en el service", async () => {
      const service = mockPersonaColaboradoraService()
      service.create.mockReturnValue({ id: "1" })
      const controller = new PersonaColaboradoraController(service)
      const req = {
        body: {
          nombreFantasia: "anon123",
          aceptaMensajeriaInterna: true,
          mediosDeContacto: [{ tipo: "EMAIL", valor: "test@example.com" }],
        },
      }
      const res = mockRes()
      const next = jest.fn()

      await controller.create(req, res, next)

      expect(service.create).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(201)
    })
  })

  describe("update", () => {
    test("con body válido, delega en el service pasando el id de la ruta y responde 200", async () => {
      const personaActualizada = {
        id: "1",
        nombreFantasia: "anon123-editado",
        mediosDeContacto: [],
      }
      const service = mockPersonaColaboradoraService()
      service.update.mockReturnValue(personaActualizada)
      const controller = new PersonaColaboradoraController(service)
      const req = {
        params: { id: "1" },
        body: { nombreFantasia: "anon123-editado" },
      }
      const res = mockRes()
      const next = jest.fn()

      await controller.update(req, res, next)

      expect(service.update).toHaveBeenCalledWith("1", req.body)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(personaActualizada)
    })
  })

  describe("delete", () => {
    test("delega en el service con el id de la ruta y responde 204 sin body", async () => {
      const service = mockPersonaColaboradoraService()
      const controller = new PersonaColaboradoraController(service)
      const req = { params: { id: "1" } }
      const res = mockRes()
      const next = jest.fn()

      await controller.delete(req, res, next)

      expect(service.delete).toHaveBeenCalledWith("1")
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalled()
    })
  })

  describe("deleteMedioDeContacto", () => {
    test("delega con el id y el medio de contacto y responde 204", async () => {
      const service = mockPersonaColaboradoraService()
      service.deleteMedioDeContacto = jest.fn()
      const controller = new PersonaColaboradoraController(service)
      const req = { params: { id: "1", contactoId: "contacto-1" } }
      const res = mockRes()
      const next = jest.fn()

      await controller.deleteMedioDeContacto(req, res, next)

      expect(service.deleteMedioDeContacto).toHaveBeenCalledWith(
        "1",
        "contacto-1",
      )
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalled()
    })
  })

  describe("getById", () => {
    test("delega en el service con el id de la ruta y responde 200 con la persona", async () => {
      const persona = {
        id: "1",
        nombreFantasia: "anon123",
        mediosDeContacto: [],
      }
      const service = mockPersonaColaboradoraService()
      service.getById.mockReturnValue(persona)
      const controller = new PersonaColaboradoraController(service)
      const req = { params: { id: "1" } }
      const res = mockRes()
      const next = jest.fn()

      await controller.getById(req, res, next)

      expect(service.getById).toHaveBeenCalledWith("1")
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(persona)
    })
  })

  describe("getAll", () => {
    test("responde 200 con el listado que devuelve el service", async () => {
      const personas = [
        { id: "1", nombreFantasia: "anon123", mediosDeContacto: [] },
      ]
      const service = mockPersonaColaboradoraService()
      service.getAll.mockReturnValue(personas)
      const controller = new PersonaColaboradoraController(service)
      const req = {}
      const res = mockRes()
      const next = jest.fn()

      await controller.getAll(req, res, next)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(personas)
    })
  })
})
