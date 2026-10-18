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

  async existePerfilConHabilidad(habilidadId) {
    return Boolean(
      await this.model.exists({
        $or: [
          { "perfiles.habilidadesRequeridas": habilidadId },
          { "perfiles.habilidadesOpcionales": habilidadId },
        ],
      }),
    )
  }

  async save(proyecto) {
    return await guardar(this.model, proyecto)
  }

  async deleteById(id) {
    await this.model.findByIdAndDelete(id)
  }

  async findByEstadoYAlgunaHabilidadRequerida(estado, habilidadesIds) {
    return await this.model.find({
      estado,
      "perfiles.habilidadesRequeridas": { $in: habilidadesIds },
    })
  }
}
