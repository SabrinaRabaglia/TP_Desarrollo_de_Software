import { DomainValidationError } from "../errors/DomainErrors.js"

export default class Cuenta {
  constructor(nombreUsuario, tipo) {
    if (!nombreUsuario) {
      throw new DomainValidationError("El nombre de usuario es obligatorio")
    }
    
    this.nombreUsuario = nombreUsuario
    this.tipo = tipo
  }
}
