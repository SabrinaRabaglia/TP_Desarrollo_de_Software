import { expect, jest, test } from "@jest/globals"
import mongoose from "mongoose"
import {
  AlreadyExists,
  BadRequestError,
  CredencialesInvalidas,
  EntityNotFound,
  InvalidReference,
  NoAutenticado,
  NoAutorizado,
  ServicioNoDisponible,
} from "../../src/errors/ApplicationErrors.js"
import {
  DomainRuleError,
  DomainValidationError,
} from "../../src/domain/errors/DomainErrors.js"
import errorHandler from "../../src/middlewares/errorHandler.js"

const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
})

test("devuelve el status, mensaje y detalles del error de validación", () => {
  const details = [{ path: ["titulo"], message: "Campo obligatorio" }]
  const res = mockRes()

  errorHandler(
    new BadRequestError("Datos inválidos", details),
    {},
    res,
    jest.fn(),
  )

  expect(res.status).toHaveBeenCalledWith(400)
  expect(res.json).toHaveBeenCalledWith({ message: "Datos inválidos", details })
})

test("responde 400 en JSON para un body mal formado", () => {
  const error = new SyntaxError("Contenido del body inválido")
  error.status = 400
  error.type = "entity.parse.failed"
  const res = mockRes()

  errorHandler(error, {}, res, jest.fn())

  expect(res.status).toHaveBeenCalledWith(400)
  expect(res.json).toHaveBeenCalledWith({
    message: "JSON inválido",
    details: [],
  })
})

test.each([
  [new DomainValidationError("Campo obligatorio"), 422],
  [new DomainRuleError("Estado inválido"), 409],
  [new EntityNotFound("Recurso no encontrado"), 404],
  [new InvalidReference("Referencia inválida"), 404],
  [new AlreadyExists("Ya existe"), 409],
  [new CredencialesInvalidas("Email o contraseña incorrectos"), 401],
  [new NoAutenticado("Falta el token"), 401],
  [new NoAutorizado("Rol no permitido"), 403],
  [new ServicioNoDisponible("Telegram no está disponible"), 503],
])("traduce %s al status HTTP correspondiente", (error, status) => {
  const res = mockRes()

  errorHandler(error, {}, res, jest.fn())

  expect(res.status).toHaveBeenCalledWith(status)
  expect(res.json).toHaveBeenCalledWith({
    message: error.message,
    details: [],
  })
})

const errorDeValidacionDeMongoose = () => {
  const error = new mongoose.Error.ValidationError()
  for (const path of ["titulo", "cantHoras"]) {
    error.addError(
      path,
      new mongoose.Error.ValidatorError({ message: `${path} inválido`, path }),
    )
  }
  return error
}

test.each([
  [
    "un id con formato inválido",
    new mongoose.Error.CastError("ObjectId", "123", "colectivo"),
    400,
    "Valor inválido para 'colectivo'",
  ],
  [
    "una validación del schema",
    errorDeValidacionDeMongoose(),
    400,
    "titulo inválido | cantHoras inválido",
  ],
  [
    "una clave única duplicada",
    Object.assign(new Error("E11000"), {
      code: 11000,
      keyValue: { titulo: "Repetido" },
    }),
    409,
    'Valor duplicado: {"titulo":"Repetido"}',
  ],
])("traduce %s de Mongoose", (_caso, error, status, message) => {
  const res = mockRes()

  errorHandler(error, {}, res, jest.fn())

  expect(res.status).toHaveBeenCalledWith(status)
  expect(res.json).toHaveBeenCalledWith({ message, details: [] })
})

test("responde 500 sin exponer el mensaje de un error inesperado", () => {
  const res = mockRes()
  const log = jest.spyOn(console, "error").mockImplementation(() => {})
  try {
    errorHandler(new Error("Información interna"), {}, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      message: "Error interno del servidor",
      details: [],
    })
  } finally {
    log.mockRestore()
  }
})
