import { BadRequestError } from "../errors/AppError.js"
import {
  AlreadyExists,
  EntityNotFound,
  InvalidReference,
} from "../errors/ApplicationErrors.js"
import { DomainValidationError, DomainRuleError } from "../domain/errors/DomainErrors.js"

const jsonError = (res, status, message, details = []) =>
  res.status(status).json({ message, details })

export default function errorHandler(error, _req, res, next) {
  if (res.headersSent) {
    return next(error)
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

  if (error instanceof AlreadyExists) {
    return jsonError(res, 409, error.message)
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
