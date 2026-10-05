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
    colectivo: "65f1a2b3c4d5e6f708192a10",
    modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
    habilidadesRequeridas: ["65f1a2b3c4d5e6f708192a11", "65f1a2b3c4d5e6f708192a12"],
    estado: EstadoProyecto.PUBLICADO,
    fechaAlta: "2026-09-01T00:00:00.000Z",
    fechaCierre: null,
  }

  describe("getAll", () => {
    test("responde con 200 y la lista de proyectos devuelta por el service", async () => {
      const proyectoServiceMock = mockProyectoService()
      const lista = [proyectoValido]
      proyectoServiceMock.getAll.mockReturnValue(lista)

      const controller = new ProyectoController(proyectoServiceMock)
      const req = {}
      const res = mockRes()
        const next = jest.fn()

      await controller.getAll(req, res, next)

      expect(proyectoServiceMock.getAll).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(lista)
    })
  })

  describe("getById", () => {
    test("responde con 200 y el proyecto obtenido según el id", async () => {
      const proyectoServiceMock = mockProyectoService()
      proyectoServiceMock.getById.mockReturnValue(proyectoValido)

      const controller = new ProyectoController(proyectoServiceMock)
      const req = { params: { id: "1" } }
      const res = mockRes()
      const next = jest.fn()

      await controller.getById(req, res, next)

      expect(proyectoServiceMock.getById).toHaveBeenCalledWith("1")
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(proyectoValido)
    })
  })

  describe("create", () => {
    test("con body valido, delega en el service y responde con 201 el proyecto creado",async  () => {
      const proyectoServiceMock = mockProyectoService()
      const proyectoCreado = { ...proyectoValido, id: "proyecto-1" }
      proyectoServiceMock.create.mockReturnValue(proyectoCreado)

      const controller = new ProyectoController(proyectoServiceMock)
      const req = { body: { ...proyectoValido } }
      const res = mockRes()
      const next = jest.fn()

      await controller.create(req, res, next)

      expect(proyectoServiceMock.create).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(proyectoCreado)
    })

    test("con body inválido (falta un campo obligatorio), tira BadRequestError y no llama al service", async () => {
      const proyectoServiceMock = mockProyectoService()
      const controller = new ProyectoController(proyectoServiceMock)
      const req = {
        body: {
          titulo: "Proyecto Incompleto",
          descripcion: "Le faltan varios campos",
        },
      }
      const res = mockRes()
      const next = jest.fn()

        await controller.create(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect(proyectoServiceMock.create).not.toHaveBeenCalled();

    })

    test.each([
      ["colectivo", { colectivo: "Asamblea Ambiental del Sur" }],
      ["habilidadesRequeridas", { habilidadesRequeridas: ["hab-1"] }],
    ])("con un %s que no es un id válido, tira BadRequestError", async (_campo, cambios) => {
      const proyectoServiceMock = mockProyectoService()
      const controller = new ProyectoController(proyectoServiceMock)
      const next = jest.fn()

      await controller.create({ body: { ...proyectoValido, ...cambios } }, mockRes(), next)

      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
      expect(proyectoServiceMock.create).not.toHaveBeenCalled()
    })

    test("con un campo extra no declarado en el schema, tira BadRequestError", async () => {
      const proyectoServiceMock = mockProyectoService()
      const controller = new ProyectoController(proyectoServiceMock)
      const req = {
        body: {
          ...proyectoValido,
          campoInexistente: "no debería estar",
        },
      }
      const res = mockRes()
      const next = jest.fn()

      await controller.create(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect(proyectoServiceMock.create).not.toHaveBeenCalled();
    })
  })

  describe("put", () => {
    test("con body valido actualiza el proyecto y responde con 200", async () => {
      const proyectoServiceMock = mockProyectoService()
      const proyectoGuardado = { ...proyectoValido, id: "1" }
      proyectoServiceMock.update.mockReturnValue(proyectoGuardado)

      const controller = new ProyectoController(proyectoServiceMock)
      const req = { params: { id: "1" }, body: { ...proyectoValido } }
      const res = mockRes()
      const next = jest.fn()

      await controller.put(req, res, next)

      expect(proyectoServiceMock.update).toHaveBeenCalledWith(
        "1",
        expect.any(Object),
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(proyectoGuardado)
    })

    test("con body invalido tira BadRequestError y no llama al service", async () => {
      const proyectoServiceMock = mockProyectoService()
      const controller = new ProyectoController(proyectoServiceMock)
      const req = { params: { id: "1" }, body: { titulo: "Solo título" } }
      const res = mockRes()
      const next = jest.fn()

      await controller.put(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect(proyectoServiceMock.update).not.toHaveBeenCalled();
    })
  })

  describe("patch", () => {
    test("con actualización parcial valida delega en el service y responde con 200", async () => {
      const proyectoServiceMock = mockProyectoService()
      const cambiosParciales = { titulo: "Título Modificado" }
      const proyectoActualizado = { ...proyectoValido, ...cambiosParciales }
      proyectoServiceMock.update.mockReturnValue(proyectoActualizado)

      const controller = new ProyectoController(proyectoServiceMock)
      const req = { params: { id: "1" }, body: cambiosParciales }
      const res = mockRes()
      const next = jest.fn()

      await controller.patch(req, res, next)

      expect(proyectoServiceMock.update).toHaveBeenCalledWith(
        "1",
        cambiosParciales,
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(proyectoActualizado)
    })
  })

  describe("delete", () => {
    test("llama al delete del service y responde con 204", async () => {
      const proyectoServiceMock = mockProyectoService()
      const controller = new ProyectoController(proyectoServiceMock)
      const req = { params: { id: "1" } }
      const res = mockRes()
      const next = jest.fn()

      await controller.delete(req, res, next)

      expect(proyectoServiceMock.delete).toHaveBeenCalledWith("1")
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalled()
    })
  })
})
