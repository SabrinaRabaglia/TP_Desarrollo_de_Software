import { TipoCuenta } from "./enums/TipoCuenta.js"

export default class Cuenta {
  constructor(nombreUsuario, tipo) {
    if (!nombreUsuario) {
      throw new Error("La cuenta debe tener un nombre de usuario")
    }
    if (!Object.values(TipoCuenta).includes(tipo)) {
      throw new Error(`Tipo de cuenta inválido: ${tipo}`)
    }
    this.nombreUsuario = nombreUsuario
    this.tipo = tipo
  }
}