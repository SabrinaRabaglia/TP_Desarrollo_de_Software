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

  async agregarPerfil(proyectoId, perfil) {
    const proyecto = await this.model.findById(proyectoId)
    if (!proyecto) {
      return null
    }
    proyecto.perfiles.push(perfil)
    return await proyecto.save()
  }

  async eliminarPerfil(proyectoId, perfilId) {
    const proyecto = await this.model.findById(proyectoId)
    if (!proyecto) {
      return null
    }
    proyecto.perfiles.pull(perfilId)
    return await proyecto.save()
  }
}
