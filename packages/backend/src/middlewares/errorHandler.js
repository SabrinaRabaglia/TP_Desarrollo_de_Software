import { AppError } from "../errors/AppError.js"
import { DomainValidationError, DomainRuleError } from "../domain/errors/DomainErrors.js"

export default function errorHandler(error, _req, res, next) {


  if (error instanceof DomainValidationError) {
    return res.status(422).json({
      message: error.message,
      details: [], 
    })
  }

  // 2. Si se rompió una regla de negocio o estado -> 409
  if (error instanceof DomainRuleError) {
    return res.status(409).json({
      message: error.message,
      details: [], 
    })
  }

  if (res.headersSent) {
    return next(error)
  }

  if (error instanceof AppError) {
    return res.status(error.status).json({
      message: error.message,
      details: error.details ?? [],
    })
  }

  if (
    Number.isInteger(error.status) &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return res.status(error.status).json({
      message:
        error.type === "entity.parse.failed"
          ? "JSON inválido"
          : error.expose
            ? error.message
            : "Solicitud inválida",
      details: [],
    })
  }

  console.error(error)
  return res.status(500).json({
    message: "Error interno del servidor",
    details: [],
  })
}
