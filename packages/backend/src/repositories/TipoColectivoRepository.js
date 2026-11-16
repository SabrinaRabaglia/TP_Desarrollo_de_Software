import TipoColectivoModel from "../schemas/tipoColectivoSchema.js"
import normalizarNombre from "../domain/normalizarNombre.js"

export default class TipoColectivoRepository {
  constructor() {
    this.model = TipoColectivoModel
  }

  async findAll() {
    return await this.model
      .find()
      .collation({ locale: "es" })
      .sort({ nombre: 1 })
  }

  async findByNombre(nombre) {
    const buscado = normalizarNombre(nombre)
    const tipos = await this.model.find()
    return tipos.find((tipo) => normalizarNombre(tipo.nombre) === buscado)
  }
}
