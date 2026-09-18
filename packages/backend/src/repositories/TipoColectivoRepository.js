import TipoColectivo from "../domain/TipoColectivo.js"
import normalizarNombre from "../domain/normalizarNombre.js"
import { UnprocessableEntityError } from "../errors/AppError.js"

export default class TipoColectivoRepository {
  constructor() {
    this.tipos = ["Fundación", "Asociación barrial", "ONG", "Asamblea"].map(
      (nombre) => new TipoColectivo(nombre),
    )
  }

  async findByNombre(nombre) {
    const buscado = normalizarNombre(nombre)
    return this.tipos.find((tipo) => normalizarNombre(tipo.nombre) === buscado)
  }

  async save(tipo) {
    if (!normalizarNombre(tipo.nombre)) {
      throw new UnprocessableEntityError(
        "El tipo de colectivo debe tener un nombre.",
      )
    }
    const existente = await this.findByNombre(tipo.nombre)
    if (existente) return existente

    this.tipos.push(tipo)
    return tipo
  }
}
