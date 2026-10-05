import TipoColectivo from "../../src/domain/TipoColectivo.js"
import normalizarNombre from "../../src/domain/normalizarNombre.js"

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
    const existente = await this.findByNombre(tipo.nombre)
    if (existente) return existente

    this.tipos.push(tipo)
    return tipo
  }
}
