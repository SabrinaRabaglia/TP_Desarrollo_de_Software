import { DomainValidationError } from "./errors/DomainErrors.js"

export default class TipoColectivo {
  constructor(nombre) {
    if (!nombre || !String(nombre).trim()) {
      throw new DomainValidationError("El tipo de colectivo debe tener un nombre.")
    }
    this.nombre = nombre
  }
}
