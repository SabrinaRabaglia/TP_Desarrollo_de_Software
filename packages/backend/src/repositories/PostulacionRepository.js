import PostulacionModel from "../schemas/postulacionSchema.js"
import guardar from "./guardar.js"

const REFERENCIAS = [
  { path: "personaColaboradora", select: "nombreFantasia" },
  { path: "perfil", select: "nombre" },
]

export default class PostulacionRepository {
  constructor() {
    this.model = PostulacionModel
  }

  async findAll() {
    return await this.model.find().populate(REFERENCIAS)
  }

  async findAllByColaborador(colaboradorId) {
    return await this.model.find({personaColaboradora : colaboradorId})
  }

  async findAllByPerfil(perfilId) {
    return await this.model.find({perfil : perfilId})
  }

  async findById(id) {
    return await this.model.findById(id)
  }

  async findByPersonaAndPerfil(personaId, perfilId) {
    return await this.model.findOne({
      personaColaboradora: personaId,
      perfil: perfilId,
    })
  }

  /*async findPersonasInscriptasEn(proyectoId) {
    const ids = await this.model.distinct("personaColaboradora", {
      proyecto: proyectoId,
    })
    return ids.map(String)
  }*/

  async deleteByPerfil(perfilId) {
    await this.model.deleteMany({ perfil: perfilId })
  }

  async deleteByPersona(personaId) {
    await this.model.deleteMany({ personaColaboradora: personaId })
  }

  async save(postulacion) {
    const guardada = await guardar(this.model, postulacion)
    return await guardada.populate(REFERENCIAS)
  }
}
