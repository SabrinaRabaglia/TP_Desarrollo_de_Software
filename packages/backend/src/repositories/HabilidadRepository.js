import HabilidadModel from "../schemas/habilidadSchema.js"
import guardar from "./guardar.js"

export default class HabilidadRepository {
  constructor() {
    this.model = HabilidadModel
  }

  async findAll() {
    return await this.model.find()
  }

  async findByCodigo(codigo) {
    return await this.model.findOne({ codigo })
  }

  async findById(id) {
    return await this.model.findById(id)
  }

  async deleteById(id) {
    await this.model.findByIdAndDelete(id)
  }

  async save(habilidad) {
    return await guardar(this.model, habilidad)
  }
}
