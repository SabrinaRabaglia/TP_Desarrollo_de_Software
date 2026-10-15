import ProyectoModel from "../schemas/proyectoSchema.js"
import mongoose from "mongoose"
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

  async findPerfilById(perfilId) {
    const id = new mongoose.Types.ObjectId(perfilId);
    const proyecto = await this.model.findOne(
        { "perfiles._id": id },
        {
            perfiles: {
                $elemMatch: { _id: id }
            }
        }
    );

    return proyecto?.perfiles[0] ?? null;
  }

  async findAllByHabilidades(habilidadesIds) {
  const objectIds = habilidadesIds.map(id => new mongoose.Types.ObjectId(id));

  return await this.model.find({
    perfiles: {
      $elemMatch: {
        habilidadesRequeridas: { $all: objectIds }
      }
    }
  })
  }
}
