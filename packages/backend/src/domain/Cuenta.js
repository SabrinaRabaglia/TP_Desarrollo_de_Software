import { TipoCuenta } from "./enums/TipoCuenta.js"
import { UnprocessableEntityError } from "../errors/AppError.js"

export default class Cuenta {
  constructor(nombreUsuario, tipo) {
    if (!nombreUsuario) {
      throw new UnprocessableEntityError("El nombre de usuario es obligatorio")
    }
    if (!Object.values(TipoCuenta).includes(tipo)) {
      throw new UnprocessableEntityError(`Tipo de cuenta inválido: ${tipo}`)
    }
    this.nombreUsuario = nombreUsuario
    this.tipo = tipo
  }
}
