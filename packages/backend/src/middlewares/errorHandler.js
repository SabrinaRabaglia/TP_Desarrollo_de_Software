import mongoose from "mongoose"
import {
  AlreadyExists,
  BadRequestError,
  ConcurrentModification,
  CredencialesInvalidas,
  EntityInUse,
  EntityNotFound,
  InvalidReference,
  NoAutenticado,
  NoAutorizado,
  ServicioNoDisponible,
} from "../errors/ApplicationErrors.js"
import {
  DomainValidationError,
  DomainRuleError,
} from "../domain/errors/DomainErrors.js"

const jsonError = (res, status, message, details = []) =>
  res.status(status).json({ message, details })

export default function errorHandler(error, _req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  if (error instanceof mongoose.Error.CastError) {
    return jsonError(res, 400, `Valor inválido para '${error.path}'`)
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const mensajes = Object.values(error.errors).map((e) => e.message)
    return jsonError(res, 400, mensajes.join(" | "))
  }

  if (error.code === 11000) {
    return jsonError(
      res,
      409,
      `Valor duplicado: ${JSON.stringify(error.keyValue)}`,
    )
  }

  if (error instanceof DomainValidationError) {
    return jsonError(res, 422, error.message)
  }

  if (error instanceof DomainRuleError) {
    return jsonError(res, 409, error.message)
  }

  if (error instanceof EntityNotFound || error instanceof InvalidReference) {
    return jsonError(res, 404, error.message)
  }

  if (
    error instanceof AlreadyExists ||
    error instanceof EntityInUse ||
    error instanceof ConcurrentModification
  ) {
    return jsonError(res, 409, error.message)
  }

  if (
    error instanceof CredencialesInvalidas ||
    error instanceof NoAutenticado
  ) {
    return jsonError(res, 401, error.message)
  }

  if (error instanceof NoAutorizado) {
    return jsonError(res, 403, error.message)
  }

  if (error instanceof ServicioNoDisponible) {
    return jsonError(res, 503, error.message)
  }

  if (error instanceof BadRequestError) {
    return jsonError(res, 400, error.message, error.details ?? [])
  }

  if (
    Number.isInteger(error.status) &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return jsonError(
      res,
      error.status,
      error.type === "entity.parse.failed"
        ? "JSON inválido"
        : error.expose
          ? error.message
          : "Solicitud inválida",
    )
  }

  console.error(error)
  return jsonError(res, 500, "Error interno del servidor")
}
