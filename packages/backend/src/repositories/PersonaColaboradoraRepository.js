import PersonaColaboradoraModel from "../schemas/personaColaboradoraSchema.js"
import guardar from "./guardar.js"

export default class PersonaColaboradoraRepository {
  constructor() {
    this.model = PersonaColaboradoraModel
  }

  //async findAll() {
  //  return await this.model.find().populate("habilidades")
  //}

  async findById(id) {
    return await this.model.findById(id).populate("habilidades")
  }

  async findConTodasLasHabilidades(habilidades) {
    return await this.model
      .find({ habilidades: { $all: habilidades } })
      .populate("habilidades")
  }

  async existeConHabilidad(habilidadId) {
    return Boolean(await this.model.exists({ habilidades: habilidadId }))
  }

  async deleteById(id) {
    await this.model.findByIdAndDelete(id)
  }

  async eliminarMedioDeContacto(personaId, contactoId) {
    const { matchedCount } = await this.model.updateOne(
      { _id: personaId, "mediosDeContacto._id": contactoId },
      { $pull: { mediosDeContacto: { _id: contactoId } } },
    )
    return matchedCount === 1
  }

  async save(personaColaboradora) {
    const guardada = await guardar(this.model, personaColaboradora)
    return await guardada.populate("habilidades")
  }

  async findAll(query, skip, limit) {
    const [colaboradoras, total] = await Promise.all([
      this.model.find(query)
        .populate('habilidades')
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments(query)
    ]);
    return { colaboradoras, total };
  }
}
