import { TipoMedioContacto } from "./enums/TipoMedioContacto.js"
import { DomainValidationError } from "./errors/DomainErrors.js"

export default class MedioDeContacto {
  constructor(tipo, valor) {
    MedioDeContacto.validarDatos({ tipo, valor })
    this.tipo = tipo
    this.valor = valor
  }
  static validarDatos({ tipo, valor }) {
    if (!tipo) {
      throw new DomainValidationError(
        "El tipo de medio de contacto es obligatorio",
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
  }
}
