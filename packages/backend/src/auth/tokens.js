import jwt from "jsonwebtoken"
import { NoAutenticado } from "../errors/ApplicationErrors.js"

const SECRETO_DE_DESARROLLO = "codigo-a-voluntad-secreto-de-desarrollo"

const secreto = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Falta la variable de entorno JWT_SECRET: sin ella no se pueden firmar los tokens de sesión.",
    )
  }
  return SECRETO_DE_DESARROLLO
}

export const usaSecretoDeDesarrollo = () => secreto() === SECRETO_DE_DESARROLLO

export const firmar = (usuario) =>
  jwt.sign(
    { sub: usuario.id, rol: usuario.rol, entidad: String(usuario.entidad) },
    secreto(),
    { expiresIn: process.env.JWT_EXPIRA_EN || "8h" },
  )

export const verificar = (token) => {
  try {
    return jwt.verify(token, secreto(), { algorithms: ["HS256"] })
  } catch {
    throw new NoAutenticado("El token es inválido o está vencido")
  }
}
