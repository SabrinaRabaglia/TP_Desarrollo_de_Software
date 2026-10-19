import mongoose from "mongoose"
import { ConcurrentModification } from "../errors/ApplicationErrors.js"
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
    try {
      return await guardar(this.model, proyecto)
    } catch (error) {
      // Otro pedido guardó el proyecto entre que lo leímos y lo guardamos.
      if (error instanceof mongoose.Error.VersionError) {
        throw new ConcurrentModification(
          "El proyecto se modificó mientras se procesaba el pedido. Volvé a intentar.",
        )
      }
      throw error
    }
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

  async findByHitoId(hitoId) {
  // Busca un proyecto que tenga un subdocumento hito con ese _id
  return await this.model.findOne({ "hitos._id": hitoId });
}
}
