import { describe, expect, test, jest } from "@jest/globals"
import PersonaColaboradoraController from "../../src/controllers/PersonaColaboradoraController.js"
import { BadRequestError } from "../../src/errors/AppError.js"

const UUID_VALIDO = "b8c65bfd-1234-4a12-8b12-abcdef123456"

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
    test("con body válido (solo nombreFantasia), delega en el service y responde 201", () => {
      const personaCreada = { id: "1", nombreFantasia: "anon123" }
      const personaColaboradoraServiceMock = mockPersonaColaboradoraService()
      personaColaboradoraServiceMock.create.mockReturnValue(personaCreada)
      const controller = new PersonaColaboradoraController(personaColaboradoraServiceMock)
      const req = { body: { nombreFantasia: "anon123" } }
      const res = mockRes()

      controller.create(req, res)

      expect(personaColaboradoraServiceMock.create).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(personaCreada)
    })

    test("con body válido incluyendo cuentas y habilidades (id con formato UUID), delega en el service", () => {
      const personaColaboradoraServiceMock = mockPersonaColaboradoraService()
      personaColaboradoraServiceMock.create.mockReturnValue({ id: "1" })
      const controller = new PersonaColaboradoraController(personaColaboradoraServiceMock)
      const req = {
        body: {
          nombreFantasia: "anon123",
          habilidades: [UUID_VALIDO],
          cuentas: [{ nombreUsuario: "anagomez", tipo: "GITHUB" }],
        },
      }
      const res = mockRes()

      controller.create(req, res)

      expect(personaColaboradoraServiceMock.create).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(201)
    })

    test("sin nombreFantasia, tira BadRequestError y no llama al service", () => {
      const personaColaboradoraServiceMock = mockPersonaColaboradoraService()
      const controller = new PersonaColaboradoraController(personaColaboradoraServiceMock)
      const req = { body: {} }
      const res = mockRes()

      const crearSinNombreFantasia = () => controller.create(req, res)

      expect(crearSinNombreFantasia).toThrow(BadRequestError)
      expect(personaColaboradoraServiceMock.create).not.toHaveBeenCalled()
    })

    test("con un id de habilidad que no tiene formato UUID, tira BadRequestError", () => {
      const personaColaboradoraServiceMock = mockPersonaColaboradoraService()
      const controller = new PersonaColaboradoraController(personaColaboradoraServiceMock)
      const req = { body: { nombreFantasia: "anon123", habilidades: ["react"] } }
      const res = mockRes()

      const crearConIdInvalido = () => controller.create(req, res)

      expect(crearConIdInvalido).toThrow(BadRequestError)
      expect(personaColaboradoraServiceMock.create).not.toHaveBeenCalled()
    })

    test("con una cuenta de tipo inválido (no GITHUB ni GITLAB), tira BadRequestError", () => {
      const personaColaboradoraServiceMock = mockPersonaColaboradoraService()
      const controller = new PersonaColaboradoraController(personaColaboradoraServiceMock)
      const req = {
        body: { nombreFantasia: "anon123", cuentas: [{ nombreUsuario: "anagomez", tipo: "MASTODON" }] },
      }
      const res = mockRes()

      const crearConTipoInvalido = () => controller.create(req, res)

      expect(crearConTipoInvalido).toThrow(BadRequestError)
      expect(personaColaboradoraServiceMock.create).not.toHaveBeenCalled()
    })

    test("con un campo extra no declarado en el schema, tira BadRequestError", () => {
      const personaColaboradoraServiceMock = mockPersonaColaboradoraService()
      const controller = new PersonaColaboradoraController(personaColaboradoraServiceMock)
      const req = { body: { nombreFantasia: "anon123", extra: "no debería estar" } }
      const res = mockRes()

      const crearConCampoExtra = () => controller.create(req, res)

      expect(crearConCampoExtra).toThrow(BadRequestError)
    })
  })

  describe("update", () => {
    test("con body válido, delega en el service pasando el id de la ruta y responde 200", () => {
      const personaActualizada = { id: "1", nombreFantasia: "anon123-editado" }
      const personaColaboradoraServiceMock = mockPersonaColaboradoraService()
      personaColaboradoraServiceMock.update.mockReturnValue(personaActualizada)
      const controller = new PersonaColaboradoraController(personaColaboradoraServiceMock)
      const req = { params: { id: "1" }, body: { nombreFantasia: "anon123-editado" } }
      const res = mockRes()

      controller.update(req, res)

      expect(personaColaboradoraServiceMock.update).toHaveBeenCalledWith("1", req.body)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(personaActualizada)
    })

    test("con body inválido, tira BadRequestError y no llama al service", () => {
      const personaColaboradoraServiceMock = mockPersonaColaboradoraService()
      const controller = new PersonaColaboradoraController(personaColaboradoraServiceMock)
      const req = { params: { id: "1" }, body: {} }
      const res = mockRes()

      const actualizarConBodyInvalido = () => controller.update(req, res)

      expect(actualizarConBodyInvalido).toThrow(BadRequestError)
      expect(personaColaboradoraServiceMock.update).not.toHaveBeenCalled()
    })
  })

  describe("delete", () => {
    test("delega en el service con el id de la ruta y responde 204 sin body", () => {
      const personaColaboradoraServiceMock = mockPersonaColaboradoraService()
      const controller = new PersonaColaboradoraController(personaColaboradoraServiceMock)
      const req = { params: { id: "1" } }
      const res = mockRes()

      controller.delete(req, res)

      expect(personaColaboradoraServiceMock.delete).toHaveBeenCalledWith("1")
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalled()
    })
  })

  describe("getById", () => {
    test("delega en el service con el id de la ruta y responde 200 con la persona", () => {
      const persona = { id: "1", nombreFantasia: "anon123" }
      const personaColaboradoraServiceMock = mockPersonaColaboradoraService()
      personaColaboradoraServiceMock.getById.mockReturnValue(persona)
      const controller = new PersonaColaboradoraController(personaColaboradoraServiceMock)
      const req = { params: { id: "1" } }
      const res = mockRes()

      controller.getById(req, res)

      expect(personaColaboradoraServiceMock.getById).toHaveBeenCalledWith("1")
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(persona)
    })
  })

  describe("getAll", () => {
    test("responde 200 con el listado que devuelve el service", () => {
      const personas = [{ id: "1", nombreFantasia: "anon123" }]
      const personaColaboradoraServiceMock = mockPersonaColaboradoraService()
      personaColaboradoraServiceMock.getAll.mockReturnValue(personas)
      const controller = new PersonaColaboradoraController(personaColaboradoraServiceMock)
      const req = {}
      const res = mockRes()

      controller.getAll(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(personas)
    })
  })
})