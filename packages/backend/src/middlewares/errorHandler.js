import { AppError } from "../errors/AppError.js"

export default function errorHandler(error, _req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  if (error instanceof AppError) {
    return res.status(error.status).json({
      message: error.message,
      details: error.details ?? [],
    })
  }

  // Conserva los errores 4xx del parser de Express, como JSON inválido o un body demasiado grande.
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
