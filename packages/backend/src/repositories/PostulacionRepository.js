import PostulacionModel from "../schemas/postulacionSchema.js"
import ProyectoModel from "../schemas/proyectoSchema.js"
import guardar from "./guardar.js"
import { EstadoPostulacion } from "../domain/enums/EstadoPostulacion.js"

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
    return await this.model.find({ personaColaboradora: colaboradorId })
  }

  async findAllByPerfil(perfilId) {
    return await this.model.find({ perfil: perfilId })
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

  async findPersonasInscriptasEn(proyectoId) {
    const proyecto = await ProyectoModel.findById(proyectoId)
    if (!proyecto) return []
    const perfilesIds = proyecto.perfiles.map((p) => p._id)
    const ids = await this.model.distinct("personaColaboradora", {
      perfil: { $in: perfilesIds },
    })
    return ids.map(String)
  }

  async existeDePersonaEnProyectos(personaId, proyectoIds) {
    const proyectos = await ProyectoModel.find({ _id: { $in: proyectoIds } })
    const perfilesIds = proyectos.flatMap((p) =>
      p.perfiles.map((perf) => perf._id),
    )
    // Colabora quien tiene una postulación aceptada: postularse no alcanza.
    return Boolean(
      await this.model.exists({
        personaColaboradora: personaId,
        perfil: { $in: perfilesIds },
        estado: EstadoPostulacion.ACEPTADA,
      }),
    )
  }

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
