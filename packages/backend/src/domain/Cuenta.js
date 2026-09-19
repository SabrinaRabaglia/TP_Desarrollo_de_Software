import { DomainValidationError } from "./errors/DomainErrors.js"
import { TipoCuenta } from "./enums/TipoCuenta.js"

export default class Cuenta {
  constructor(nombreUsuario, tipo) {
    if (!nombreUsuario) {
      throw new DomainValidationError("El nombre de usuario es obligatorio.")
    }
    if (tipo !== TipoCuenta.GITHUB && tipo !== TipoCuenta.GITLAB) {
      throw new DomainValidationError("El tipo de cuenta es inválido.")
    }
    
    this.nombreUsuario = nombreUsuario
    this.tipo = tipo
  }
}
