import { UnprocessableEntityError } from "../errors/AppError.js"

export default class Cuenta {
  constructor(nombreUsuario, tipo) {
    if (!nombreUsuario) {
      throw new UnprocessableEntityError("El nombre de usuario es obligatorio")
    }
    
    this.nombreUsuario = nombreUsuario
    this.tipo = tipo
  }
}
