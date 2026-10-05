import ColectivoModel from "../schemas/colectivoSchema.js"
import guardar from "./guardar.js"

const UBICACION = ["pais", "provincia"]

export default class ColectivoRepository {
  constructor() {
    this.model = ColectivoModel
  }

  async findAll() {
    return await this.model.find().populate(UBICACION)
  }

  async findById(id) {
    return await this.model.findById(id).populate(UBICACION)
  }

  async findByNombre(nombre) {
    return await this.model.findOne({ nombre })
  }

  async save(colectivo) {
    const guardado = await guardar(this.model, colectivo)
    return await guardado.populate(UBICACION)
  }

  async delete(id) {
    return await this.model.findByIdAndDelete(id)
  }
}
