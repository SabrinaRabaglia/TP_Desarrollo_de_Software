import { TipoMedioContacto } from "./enums/TipoMedioContacto.js"
import { DomainValidationError } from "./errors/DomainErrors.js"

export default class MedioDeContacto {
  constructor(tipo, valor, id) {
    MedioDeContacto.validarDatos({ tipo, valor })
    this.tipo = tipo
    this.valor = valor
    if (id !== undefined) {
      this._id = id
    }
  }
  static validarDatos({ tipo, valor }) {
    if (!tipo) {
      throw new DomainValidationError(
        "El tipo de medio de contacto es obligatorio",
      )
    }
    if (!Object.values(TipoMedioContacto).includes(tipo)) {
      throw new DomainValidationError(
        "El tipo de medio de contacto es inválido",
      )
    }
    if (!valor) {
      throw new DomainValidationError(
        "El valor del medio de contacto es obligatorio",
      )
    }

    if (tipo === TipoMedioContacto.EMAIL) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(valor)) {
        throw new DomainValidationError("El formato del email es inválido")
      }
    }

    if (tipo === TipoMedioContacto.WHATSAPP || tipo === TipoMedioContacto.SMS) {
      const digitos = valor.replace(/[\s().-]/g, "")
      if (!/^\+?[0-9]{8,15}$/.test(digitos)) {
        throw new DomainValidationError("El formato del teléfono es inválido")
      }
    }

    if (tipo === TipoMedioContacto.TELEGRAM && !/^-?[0-9]{1,16}$/.test(valor)) {
      throw new DomainValidationError(
        "El valor de Telegram debe ser el chat id numérico que da el bot",
      )
    }
  }
}
