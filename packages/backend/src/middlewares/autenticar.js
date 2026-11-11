import { verificar } from "../auth/tokens.js"
import { NoAutenticado, NoAutorizado } from "../errors/ApplicationErrors.js"

export function autenticar(req, _res, next) {
  const token = req.headers.authorization?.match(/^Bearer (\S+)$/i)?.[1]
  if (!token) {
    return next(new NoAutenticado("Falta el token de acceso"))
  }
  try {
    const { sub, rol, entidad } = verificar(token)
    req.usuario = { id: sub, rol, entidad }
    next()
  } catch (error) {
    next(error)
  }
}

export function autorizar(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return next(new NoAutorizado("No tenés permiso para esta acción"))
    }
    next()
  }
}

export function autorizarEntidad(rol, parametro = "id") {
  return (req, _res, next) => {
    const esLaMisma =
      req.usuario.rol === rol && req.usuario.entidad === req.params[parametro]
    next(
      esLaMisma
        ? undefined
        : new NoAutorizado("No tenés permiso para esta acción"),
    )
  }
}
