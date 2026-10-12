import ProyectoModel from "../schemas/proyectoSchema.js"
import guardar from "./guardar.js"

export default class ProyectoRepository {
  constructor() {
    this.model = ProyectoModel
  }

  async findAll() {
    return await this.model.find()
  }

  async findById(id) {
    return await this.model.findById(id)
  }

  async findByTitulo(titulo) {
    return await this.model.findOne({ titulo })
  }

  async findByColectivoId(colectivoId) {
    return await this.model.find({ colectivo: colectivoId })
  }

  async save(proyecto) {
    return await guardar(this.model, proyecto)
  }

  async delete(id) {
    return await this.model.findByIdAndDelete(id)
  }
}
