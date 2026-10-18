import { describe, expect, test, jest } from "@jest/globals"
import ProyectoController from "../../../src/controllers/ProyectoController.js"
import validar from "../../../src/middlewares/validar.js"
import { busquedaProyectosSchema } from "../../../src/validations/proyecto.js"
import { EstadoProyecto } from "../../../src/domain/enums/EstadoProyecto.js"
import { proyectoDTO } from "../../../src/dtos/proyectoDTO.js"

// El service devuelve el proyecto guardado; el controller lo pasa por el DTO.
const guardado = (proyecto) => ({ ...proyecto, id: "1", perfiles: [] })
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
  getAllByHabilidades: jest.fn(),
})

describe("ProyectoController", () => {
  const proyectoValido = {
    titulo: "Plataforma de Colaboración",
    descripcion:
      "Desarrollo de plataforma para conectar colectivos y voluntarios.",
    colectivo: "65f1a2b3c4d5e6f708192a10",
    estado: EstadoProyecto.PUBLICADO,
    fechaAlta: "2026-09-01T00:00:00.000Z",
    fechaCierre: null,
  }

  describe("getAll", () => {
    test("responde con 200 y la lista de proyectos devuelta por el service", async () => {
      const proyectoServiceMock = mockProyectoService()
      const lista = [proyectoValido]
      proyectoServiceMock.getAll.mockReturnValue(lista.map(guardado))

      const controller = new ProyectoController(proyectoServiceMock)
      const req = { query: {} }
      const res = mockRes()
      const next = jest.fn()

      await controller.getAll(req, res, next)

      expect(proyectoServiceMock.getAll).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        lista.map(guardado).map(proyectoDTO),
      )
    })

    test.each([
      [
        "una habilidad",
        "65f1a2b3c4d5e6f708192a01",
        ["65f1a2b3c4d5e6f708192a01"],
      ],
      [
        "varias habilidades",
        ["65f1a2b3c4d5e6f708192a01", "65f1a2b3c4d5e6f708192a02"],
        ["65f1a2b3c4d5e6f708192a01", "65f1a2b3c4d5e6f708192a02"],
      ],
    ])(
      "con %s, el middleware las deja en una lista y el controller busca por ellas",
      async (_caso, habilidades, ids) => {
        const proyectoServiceMock = mockProyectoService()
        const lista = [proyectoValido]
        proyectoServiceMock.getAllByHabilidades.mockReturnValue(
          lista.map(guardado),
        )
        const controller = new ProyectoController(proyectoServiceMock)
        const res = mockRes()

        const req = { query: { habilidades } }

        await validar(busquedaProyectosSchema, "query")(req, res, jest.fn())
        await controller.getAll(req, res, jest.fn())

        expect(proyectoServiceMock.getAllByHabilidades).toHaveBeenCalledWith(
          ids,
        )
        expect(proyectoServiceMock.getAll).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(
          lista.map(guardado).map(proyectoDTO),
        )
      },
    )
  })

  describe("getById", () => {
    test("responde con 200 y el proyecto obtenido según el id", async () => {
      const proyectoServiceMock = mockProyectoService()
      proyectoServiceMock.getById.mockReturnValue(guardado(proyectoValido))

      const controller = new ProyectoController(proyectoServiceMock)
      const req = { params: { id: "1" } }
      const res = mockRes()
      const next = jest.fn()

      await controller.getById(req, res, next)

      expect(proyectoServiceMock.getById).toHaveBeenCalledWith("1")
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        proyectoDTO(guardado(proyectoValido)),
      )
    })
  })

  describe("create", () => {
    test("con body valido, delega en el service y responde con 201 el proyecto creado", async () => {
      const proyectoServiceMock = mockProyectoService()
      const proyectoCreado = { ...proyectoValido, id: "proyecto-1" }
      proyectoServiceMock.create.mockReturnValue(guardado(proyectoCreado))

      const controller = new ProyectoController(proyectoServiceMock)
      const req = { body: { ...proyectoValido } }
      const res = mockRes()
      const next = jest.fn()

      await controller.create(req, res, next)

      expect(proyectoServiceMock.create).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(
        proyectoDTO(guardado(proyectoCreado)),
      )
    })
  })

  describe("update", () => {
    test("con body valido actualiza el proyecto y responde con 200", async () => {
      const proyectoServiceMock = mockProyectoService()
      const proyectoGuardado = { ...proyectoValido, id: "1" }
      proyectoServiceMock.update.mockReturnValue(guardado(proyectoGuardado))

      const controller = new ProyectoController(proyectoServiceMock)
      const req = { params: { id: "1" }, body: { ...proyectoValido } }
      const res = mockRes()
      const next = jest.fn()

      await controller.update(req, res, next)

      expect(proyectoServiceMock.update).toHaveBeenCalledWith(
        "1",
        expect.any(Object),
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        proyectoDTO(guardado(proyectoGuardado)),
      )
    })
  })

  describe("patch", () => {
    test("con actualización parcial valida delega en el service y responde con 200", async () => {
      const proyectoServiceMock = mockProyectoService()
      const cambiosParciales = { titulo: "Título Modificado" }
      const proyectoActualizado = { ...proyectoValido, ...cambiosParciales }
      proyectoServiceMock.update.mockReturnValue(guardado(proyectoActualizado))

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
      expect(res.json).toHaveBeenCalledWith(
        proyectoDTO(guardado(proyectoActualizado)),
      )
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
