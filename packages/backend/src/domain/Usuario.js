import { DomainValidationError } from "./errors/DomainErrors.js"
import { RolUsuario } from "./enums/RolUsuario.js"

const FORMA_DE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default class Usuario {
  constructor(email, hashContrasena, rol, entidad) {
    const normalizado = Usuario.normalizarEmail(email)
    Usuario.validarDatos({ email: normalizado, hashContrasena, rol, entidad })
    this.email = normalizado
    this.hashContrasena = hashContrasena
    this.rol = rol
    this.entidad = entidad
  }

  static normalizarEmail(email) {
    return typeof email === "string" ? email.trim().toLowerCase() : email
  }

  static validarDatos({ email, hashContrasena, rol, entidad }) {
    if (!email || !FORMA_DE_EMAIL.test(email)) {
      throw new DomainValidationError(
        "El email es obligatorio y debe ser válido.",
      )
    }
    if (!hashContrasena) {
      throw new DomainValidationError("La contraseña es obligatoria.")
    }
    if (!Object.values(RolUsuario).includes(rol)) {
      throw new DomainValidationError("El rol del usuario es inválido.")
    }
    if (!entidad) {
      throw new DomainValidationError(
        "El usuario debe estar asociado a un colectivo o a una persona colaboradora.",
      )
    }
  }
}
