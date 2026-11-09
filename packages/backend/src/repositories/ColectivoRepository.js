import ColectivoModel from "../schemas/colectivoSchema.js"
import guardar from "./guardar.js"

const REFERENCIAS = ["pais", "provincia", "proyectos"]

export default class ColectivoRepository {
  constructor() {
    this.model = ColectivoModel
  }

  async findAll() {
    return await this.model.find().populate(REFERENCIAS)
  }

  async findById(id) {
    return await this.model.findById(id).populate(REFERENCIAS)
  }

  async findByNombre(nombre) {
    return await this.model.findOne({ nombre })
  }

  async save(colectivo) {
    const guardado = await guardar(this.model, colectivo)
    return await guardado.populate(REFERENCIAS)
  }

  async deleteById(id) {
    await this.model.findByIdAndDelete(id)
  }
}
