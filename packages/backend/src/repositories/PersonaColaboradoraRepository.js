import PersonaColaboradoraModel from "../schemas/personaColaboradoraSchema.js"
import guardar from "./guardar.js"

export default class PersonaColaboradoraRepository {
  constructor() {
    this.model = PersonaColaboradoraModel
  }

  async getAll() {
    return await this.model.find().populate("habilidades")
  }

  async findById(id) {
    return await this.model.findById(id).populate("habilidades")
  }

  async findConTodasLasHabilidades(habilidades) {
    return await this.model
      .find({ habilidades: { $all: habilidades } })
      .populate("habilidades")
  }

  async deleteById(id) {
    return Boolean(await this.model.findByIdAndDelete(id))
  }

  async save(personaColaboradora) {
    const guardada = await guardar(this.model, personaColaboradora)
    return await guardada.populate("habilidades")
  }
}
