import { describe, expect, test, jest } from "@jest/globals"
import HabilidadController from "../../../src/controllers/HabilidadController.js"
import { BadRequestError } from "../../../src/errors/AppError.js"

const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
})

const mockHabilidadService = () => ({
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getById: jest.fn(),
  getAll: jest.fn(),
})


describe("HabilidadController", () => {
  describe("create", () => {
    test("con body válido, delega en el service y responde 201 con la habilidad creada", async () => {
      const habilidadCreada = {
        id: "1",
        titulo: "React",
        codigo: "react",
        descripcion: "desc",
      }
      const habilidadServiceMock = mockHabilidadService()
      habilidadServiceMock.create.mockReturnValue(habilidadCreada)
      const controller = new HabilidadController(habilidadServiceMock)
      const req = {
        body: { titulo: "React", codigo: "react", descripcion: "desc" },
      }
      const res = mockRes()
      const next = jest.fn()
      await controller.create(req, res, next)

      expect(habilidadServiceMock.create).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(habilidadCreada)
    })

    test("con body inválido (falta un campo), tira BadRequestError y no llama al service", async () => {
      const habilidadServiceMock = mockHabilidadService()
      const controller = new HabilidadController(habilidadServiceMock)
      const req = { body: { titulo: "React", codigo: "react" } }
      const res = mockRes()
      const next = jest.fn()

      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(habilidadServiceMock .create).not.toHaveBeenCalled();
    })

    test("con un campo extra no declarado en el schema, tira BadRequestError", async () => {
      const habilidadServiceMock = mockHabilidadService()
      const controller = new HabilidadController(habilidadServiceMock)
      const req = {
        body: {
          titulo: "React",
          codigo: "react",
          descripcion: "desc",
          extra: "no debería estar",
        },
      }
      const res = mockRes()
      const next = jest.fn()

      await controller.create(req, res, next); 
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError)); 
      expect(habilidadServiceMock.create).not.toHaveBeenCalled();

    })
  })

  describe("update", () => {
    test("con body válido, delega en el service pasando el id de la ruta y responde 200", async () => {
      const habilidadActualizada = {
        id: "1",
        titulo: "React actualizado",
        codigo: "react_actualizado",
        descripcion: "desc",
      }
      const habilidadServiceMock = mockHabilidadService()
      habilidadServiceMock.update.mockReturnValue(habilidadActualizada)
      const controller = new HabilidadController(habilidadServiceMock)
      const req = {
        params: { id: "1" },
        body: {
          titulo: "React actualizado",
          codigo: "react_actualizado",
          descripcion: "desc",
        },
      }
      const res = mockRes()
      const next = jest.fn()


      await controller.update(req, res, next)

      expect(habilidadServiceMock.update).toHaveBeenCalledWith("1", req.body)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(habilidadActualizada)
    })

    test("con body inválido, tira BadRequestError y no llama al service", async () => {
      const habilidadServiceMock = mockHabilidadService()
      const controller = new HabilidadController(habilidadServiceMock)
      const req = { params: { id: "1" }, body: {} }
      const res = mockRes()
      const next = jest.fn()

      await controller.update(req, res, next); // Se ejecuta normalmente
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError)); // Verificas el next
      expect(habilidadServiceMock.update).not.toHaveBeenCalled();
    })
  })

  describe("delete", () => {
    test("delega en el service con el id de la ruta y responde 204 sin body", async () => {
      const habilidadServiceMock = mockHabilidadService()
      const controller = new HabilidadController(habilidadServiceMock)
      const req = { params: { id: "1" } }
      const res = mockRes()
      const next = jest.fn()

      await controller.delete(req, res, next)

      expect(habilidadServiceMock.delete).toHaveBeenCalledWith("1")
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalled()
    })
  })

  describe("getById", () => {
    test("delega en el service con el id de la ruta y responde 200 con la habilidad", async () => {
      const habilidad = {
        id: "1",
        titulo: "React",
        codigo: "react",
        descripcion: "desc",
      }
      const habilidadServiceMock = mockHabilidadService()
      habilidadServiceMock.getById.mockReturnValue(habilidad)
      const controller = new HabilidadController(habilidadServiceMock)
      const req = { params: { id: "1" } }
      const res = mockRes()
      const next = jest.fn()

      await controller.getById(req, res, next)

      expect(habilidadServiceMock.getById).toHaveBeenCalledWith("1")
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(habilidad)
    })
  })

  describe("getAll", () => {
    test("responde 200 con el listado que devuelve el service", async () => {
      const habilidades = [
        { id: "1", titulo: "React", codigo: "react", descripcion: "desc" },
      ]
      const habilidadServiceMock = mockHabilidadService()
      habilidadServiceMock.getAll.mockReturnValue(habilidades)
      const controller = new HabilidadController(habilidadServiceMock)
      const req = {}
      const res = mockRes()
      const next = jest.fn()

      await controller.getAll(req, res, next)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(habilidades)
    })
  })
})
