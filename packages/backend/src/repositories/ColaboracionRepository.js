import ColaboracionModel from "../schemas/colaboracionSchema.js"
import guardar from "./guardar.js"

const REFERENCIAS = [
  { path: "personaColaboradora", select: "nombreFantasia" },
  { path: "proyecto", select: "titulo" },
]

export default class ColaboracionRepository {
  constructor() {
    this.model = ColaboracionModel
  }

  async findAll() {
    return await this.model.find().populate(REFERENCIAS)
  }

  async findByPersonaAndProyecto(personaId, proyectoId) {
    return await this.model.findOne({
      personaColaboradora: personaId,
      proyecto: proyectoId,
    })
  }

  async findPersonasInscriptasEn(proyectoId) {
    const ids = await this.model.distinct("personaColaboradora", {
      proyecto: proyectoId,
    })
    return ids.map(String)
  }

  async deleteByProyecto(proyectoId) {
    await this.model.deleteMany({ proyecto: proyectoId })
  }

  async deleteByPersona(personaId) {
    await this.model.deleteMany({ personaColaboradora: personaId })
  }

  async save(colaboracion) {
    const guardada = await guardar(this.model, colaboracion)
    return await guardada.populate(REFERENCIAS)
  }
}
