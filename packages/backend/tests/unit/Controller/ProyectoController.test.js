import { describe, expect, test, jest } from "@jest/globals"
import ProyectoController from "../../../src/controllers/ProyectoController.js"
import { BadRequestError } from "../../../src/errors/AppError.js"
import { EstadoProyecto } from "../../../src/domain/enums/EstadoProyecto.js"
import { ModalidadColaboracion } from "../../../src/domain/enums/ModalidadColaboracion.js"
import { UnidadCompromiso } from "../../../src/domain/enums/UnidadCompromiso.js"
const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
})

const mockProyectoService = () => ({
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getById: jest.fn(),
  getAll: jest.fn(),
})

describe("ProyectoController", () => {
  const proyectoValido = {
    titulo: "Plataforma de Colaboración",
    descripcion:
      "Desarrollo de plataforma para conectar colectivos y voluntarios.",
    unidadCompromiso: UnidadCompromiso.HORAS_SEMANALES,
    cantHoras: 10,
    colectivo: "Asamblea Ambiental del Sur",
    modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
    habilidadesRequeridas: ["hab-1", "hab-2"],
    estado: EstadoProyecto.PUBLICADO,
    fechaAlta: "2026-09-01T00:00:00.000Z",
    fechaCierre: null,
  }

  describe("getAll", () => {
    test("responde con 200 y la lista de proyectos devuelta por el service", () => {
      const proyectoServiceMock = mockProyectoService()
      const lista = [proyectoValido]
      proyectoServiceMock.getAll.mockReturnValue(lista)

      const controller = new ProyectoController(proyectoServiceMock)
      const req = {}
      const res = mockRes()

      controller.getAll(req, res)

      expect(proyectoServiceMock.getAll).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(lista)
    })
  })

  describe("getById", () => {
    test("responde con 200 y el proyecto obtenido según el id", () => {
      const proyectoServiceMock = mockProyectoService()
      proyectoServiceMock.getById.mockReturnValue(proyectoValido)

      const controller = new ProyectoController(proyectoServiceMock)
      const req = { params: { id: "1" } }
      const res = mockRes()

      controller.getById(req, res)

      expect(proyectoServiceMock.getById).toHaveBeenCalledWith("1")
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(proyectoValido)
    })
  })

  describe("create", () => {
    test("con body valido, delega en el service y responde con 201 el proyecto creado", () => {
      const proyectoServiceMock = mockProyectoService()
      const proyectoCreado = { ...proyectoValido, id: "proyecto-1" }
      proyectoServiceMock.create.mockReturnValue(proyectoCreado)

      const controller = new ProyectoController(proyectoServiceMock)
      const req = { body: { ...proyectoValido } }
      const res = mockRes()

      controller.create(req, res)

      expect(proyectoServiceMock.create).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(proyectoCreado)
    })

    test("con body inválido (falta un campo obligatorio), tira BadRequestError y no llama al service", () => {
      const proyectoServiceMock = mockProyectoService()
      const controller = new ProyectoController(proyectoServiceMock)
      const req = {
        body: {
          titulo: "Proyecto Incompleto",
          descripcion: "Le faltan varios campos",
        },
      }
      const res = mockRes()

      expect(() => controller.create(req, res)).toThrow(BadRequestError)
      expect(proyectoServiceMock.create).not.toHaveBeenCalled()
    })

    test("con un campo extra no declarado en el schema, tira BadRequestError", () => {
      const proyectoServiceMock = mockProyectoService()
      const controller = new ProyectoController(proyectoServiceMock)
      const req = {
        body: {
          ...proyectoValido,
          campoInexistente: "no debería estar",
        },
      }
      const res = mockRes()

      expect(() => controller.create(req, res)).toThrow(BadRequestError)
      expect(proyectoServiceMock.create).not.toHaveBeenCalled()
    })
  })

  describe("put", () => {
    test("con body valido actualiza el proyecto y responde con 200", () => {
      const proyectoServiceMock = mockProyectoService()
      const proyectoGuardado = { ...proyectoValido, id: "1" }
      proyectoServiceMock.update.mockReturnValue(proyectoGuardado)

      const controller = new ProyectoController(proyectoServiceMock)
      const req = { params: { id: "1" }, body: { ...proyectoValido } }
      const res = mockRes()

      controller.put(req, res)

      expect(proyectoServiceMock.update).toHaveBeenCalledWith(
        "1",
        expect.any(Object),
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(proyectoGuardado)
    })

    test("con body invalido tira BadRequestError y no llama al service", () => {
      const proyectoServiceMock = mockProyectoService()
      const controller = new ProyectoController(proyectoServiceMock)
      const req = { params: { id: "1" }, body: { titulo: "Solo título" } }
      const res = mockRes()

      expect(() => controller.put(req, res)).toThrow(BadRequestError)
      expect(proyectoServiceMock.update).not.toHaveBeenCalled()
    })
  })

  describe("patch", () => {
    test("con actualización parcial valida delega en el service y responde con 200", () => {
      const proyectoServiceMock = mockProyectoService()
      const cambiosParciales = { titulo: "Título Modificado" }
      const proyectoActualizado = { ...proyectoValido, ...cambiosParciales }
      proyectoServiceMock.update.mockReturnValue(proyectoActualizado)

      const controller = new ProyectoController(proyectoServiceMock)
      const req = { params: { id: "1" }, body: cambiosParciales }
      const res = mockRes()

      controller.patch(req, res)

      expect(proyectoServiceMock.update).toHaveBeenCalledWith(
        "1",
        cambiosParciales,
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(proyectoActualizado)
    })
  })

  describe("delete", () => {
    test("llama al delete del service y responde con 204", () => {
      const proyectoServiceMock = mockProyectoService()
      const controller = new ProyectoController(proyectoServiceMock)
      const req = { params: { id: "1" } }
      const res = mockRes()

      controller.delete(req, res)

      expect(proyectoServiceMock.delete).toHaveBeenCalledWith("1")
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalled()
    })
  })
})
