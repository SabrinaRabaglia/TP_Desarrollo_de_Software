import { describe, expect, test, jest } from "@jest/globals"
import PersonaColaboradoraController from "../../src/controllers/PersonaColaboradoraController.js"
import { BadRequestError } from "../../src/errors/AppError.js"

const UUID_VALIDO = "b8c65bfd-1234-4a12-8b12-abcdef123456"

const crearResFalso = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
})

const crearPersonaColaboradoraServiceFalso = () => ({
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
      const service = crearPersonaColaboradoraServiceFalso()
      service.create.mockReturnValue(personaCreada)
      const controller = new PersonaColaboradoraController(service)
      const req = { body: { nombreFantasia: "anon123" } }
      const res = crearResFalso()

      controller.create(req, res)

      expect(service.create).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(personaCreada)
    })

    test("con body válido incluyendo cuentas y habilidades (id con formato UUID), delega en el service", () => {
      const service = crearPersonaColaboradoraServiceFalso()
      service.create.mockReturnValue({ id: "1" })
      const controller = new PersonaColaboradoraController(service)
      const req = {
        body: {
          nombreFantasia: "anon123",
          habilidades: [UUID_VALIDO],
          cuentas: [{ nombreUsuario: "anagomez", tipo: "GITHUB" }],
        },
      }
      const res = crearResFalso()

      controller.create(req, res)

      expect(service.create).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(201)
    })

    test("sin nombreFantasia, tira BadRequestError y no llama al service", () => {
      const service = crearPersonaColaboradoraServiceFalso()
      const controller = new PersonaColaboradoraController(service)
      const req = { body: {} }
      const res = crearResFalso()

      const crearSinNombreFantasia = () => controller.create(req, res)

      expect(crearSinNombreFantasia).toThrow(BadRequestError)
      expect(service.create).not.toHaveBeenCalled()
    })

    test("con un id de habilidad que no tiene formato UUID, tira BadRequestError", () => {
      const service = crearPersonaColaboradoraServiceFalso()
      const controller = new PersonaColaboradoraController(service)
      const req = {
        body: { nombreFantasia: "anon123", habilidades: ["react"] },
      }
      const res = crearResFalso()

      const crearConIdInvalido = () => controller.create(req, res)

      expect(crearConIdInvalido).toThrow(BadRequestError)
      expect(service.create).not.toHaveBeenCalled()
    })

    test("con una cuenta de tipo inválido (no GITHUB ni GITLAB), tira BadRequestError", () => {
      const service = crearPersonaColaboradoraServiceFalso()
      const controller = new PersonaColaboradoraController(service)
      const req = {
        body: {
          nombreFantasia: "anon123",
          cuentas: [{ nombreUsuario: "anagomez", tipo: "MASTODON" }],
        },
      }
      const res = crearResFalso()

      const crearConTipoInvalido = () => controller.create(req, res)

      expect(crearConTipoInvalido).toThrow(BadRequestError)
      expect(service.create).not.toHaveBeenCalled()
    })

    test("con un campo extra no declarado en el schema, tira BadRequestError", () => {
      const service = crearPersonaColaboradoraServiceFalso()
      const controller = new PersonaColaboradoraController(service)
      const req = {
        body: { nombreFantasia: "anon123", extra: "no debería estar" },
      }
      const res = crearResFalso()

      const crearConCampoExtra = () => controller.create(req, res)

      expect(crearConCampoExtra).toThrow(BadRequestError)
    })
  })

  describe("update", () => {
    test("con body válido, delega en el service pasando el id de la ruta y responde 200", () => {
      const personaActualizada = { id: "1", nombreFantasia: "anon123-editado" }
      const service = crearPersonaColaboradoraServiceFalso()
      service.update.mockReturnValue(personaActualizada)
      const controller = new PersonaColaboradoraController(service)
      const req = {
        params: { id: "1" },
        body: { nombreFantasia: "anon123-editado" },
      }
      const res = crearResFalso()

      controller.update(req, res)

      expect(service.update).toHaveBeenCalledWith("1", req.body)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(personaActualizada)
    })

    test("con body inválido, tira BadRequestError y no llama al service", () => {
      const service = crearPersonaColaboradoraServiceFalso()
      const controller = new PersonaColaboradoraController(service)
      const req = { params: { id: "1" }, body: {} }
      const res = crearResFalso()

      const actualizarConBodyInvalido = () => controller.update(req, res)

      expect(actualizarConBodyInvalido).toThrow(BadRequestError)
      expect(service.update).not.toHaveBeenCalled()
    })
  })

  describe("delete", () => {
    test("delega en el service con el id de la ruta y responde 204 sin body", () => {
      const service = crearPersonaColaboradoraServiceFalso()
      const controller = new PersonaColaboradoraController(service)
      const req = { params: { id: "1" } }
      const res = crearResFalso()

      controller.delete(req, res)

      expect(service.delete).toHaveBeenCalledWith("1")
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalled()
    })
  })

  describe("getById", () => {
    test("delega en el service con el id de la ruta y responde 200 con la persona", () => {
      const persona = { id: "1", nombreFantasia: "anon123" }
      const service = crearPersonaColaboradoraServiceFalso()
      service.getById.mockReturnValue(persona)
      const controller = new PersonaColaboradoraController(service)
      const req = { params: { id: "1" } }
      const res = crearResFalso()

      controller.getById(req, res)

      expect(service.getById).toHaveBeenCalledWith("1")
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(persona)
    })
  })

  describe("getAll", () => {
    test("responde 200 con el listado que devuelve el service", () => {
      const personas = [{ id: "1", nombreFantasia: "anon123" }]
      const service = crearPersonaColaboradoraServiceFalso()
      service.getAll.mockReturnValue(personas)
      const controller = new PersonaColaboradoraController(service)
      const req = {}
      const res = crearResFalso()

      controller.getAll(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(personas)
    })
  })
})
