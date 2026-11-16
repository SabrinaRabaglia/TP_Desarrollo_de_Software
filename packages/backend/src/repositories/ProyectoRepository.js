import mongoose from "mongoose"
import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js"
import { inicioDelDiaSiguiente } from "../domain/fechas.js"
import ProyectoModel from "../schemas/proyectoSchema.js"
import guardar from "./guardar.js"

const abierto = { estado: { $ne: EstadoProyecto.CERRADO } }
const CAMPOS_DEL_HITO = ["fecha", "porcentajeConcrecion", "descripcion"]
const dadoDeAltaAntesDe = (fecha) =>
  fecha === undefined
    ? {}
    : { fechaAlta: { $lt: inicioDelDiaSiguiente(fecha) } }

export default class ProyectoRepository {
  constructor() {
    this.model = ProyectoModel
  }

  //async findAll() {
  //  return await this.model.find()
  //}

  async findById(id) {
    return await this.model.findById(id)
  }

  async findByTitulo(titulo) {
    return await this.model.findOne({ titulo })
  }

  async findByColectivoId(colectivoId) {
    return await this.model.find({ colectivo: colectivoId })
  }

  async findProyectoYPerfilPorId(perfilId) {
    const proyecto = await this.model.findOne({ "perfiles._id": perfilId })
    return { proyecto, perfil: proyecto?.perfiles.id(perfilId) ?? null }
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

  // Como el anterior, con el colectivo y las habilidades requeridas completas:
  // la búsqueda de perfiles muestra sus nombres.
  async findConPerfilesQueRequieran(estado, habilidadesIds) {
    return await this.model
      .find({
        estado,
        "perfiles.habilidadesRequeridas": { $in: habilidadesIds },
      })
      .populate("colectivo")
      .populate("perfiles.habilidadesRequeridas")
  }

  async agregarPerfil(proyectoId, perfil) {
    const _id = new mongoose.Types.ObjectId()
    const proyecto = await this.model.findOneAndUpdate(
      { _id: proyectoId, ...abierto },
      { $push: { perfiles: { ...perfil, _id } } },
      { new: true, runValidators: true },
    )
    return proyecto?.perfiles.id(_id) ?? null
  }

  // Se guardan los datos editables, campo por campo: quiénes ocupan el perfil
  // lo escriben las aceptaciones y las bajas, y una edición no debe pisarlo.
  async actualizarPerfil(proyectoId, perfilId, perfil) {
    const proyecto = await this.model.findOneAndUpdate(
      { _id: proyectoId, "perfiles._id": perfilId, ...abierto },
      {
        $set: Object.fromEntries(
          Object.entries(perfil.datosEditables()).map(([campo, valor]) => [
            `perfiles.$.${campo}`,
            valor,
          ]),
        ),
      },
      { new: true, runValidators: true },
    )
    return proyecto?.perfiles.id(perfilId) ?? null
  }

  async eliminarPerfil(proyectoId, perfilId) {
    const { matchedCount } = await this.model.updateOne(
      { _id: proyectoId, "perfiles._id": perfilId, ...abierto },
      { $pull: { perfiles: { _id: perfilId } } },
    )
    return matchedCount === 1
  }

  async findByHitoId(hitoId) {
    return await this.model.findOne({ "hitos._id": hitoId })
  }

  async agregarHito(proyectoId, hito) {
    const _id = new mongoose.Types.ObjectId()
    const proyecto = await this.model.findOneAndUpdate(
      { _id: proyectoId, ...dadoDeAltaAntesDe(hito.fecha) },
      { $push: { hitos: { ...hito, _id } } },
      { new: true, runValidators: true },
    )
    return proyecto?.hitos.id(_id) ?? null
  }

  async actualizarHito(hitoId, cambios) {
    const $set = Object.fromEntries(
      CAMPOS_DEL_HITO.filter((campo) => campo in cambios).map((campo) => [
        `hitos.$.${campo}`,
        cambios[campo],
      ]),
    )
    const proyecto = await this.model.findOneAndUpdate(
      { "hitos._id": hitoId, ...dadoDeAltaAntesDe(cambios.fecha) },
      { $set },
      { new: true, runValidators: true },
    )
    return proyecto?.hitos.id(hitoId) ?? null
  }

  async eliminarHito(hitoId) {
    const { matchedCount } = await this.model.updateOne(
      { "hitos._id": hitoId },
      { $pull: { hitos: { _id: hitoId } } },
    )
    return matchedCount === 1
  }

  async findAll(query, skip, limit) {
    const [proyectos, total] = await Promise.all([
      this.model
        .find(query)
        .populate("perfiles.habilidadesRequeridas")
        .skip(skip)
        .limit(limit),
      this.model.countDocuments(query),
    ])
    return { proyectos, total }
  }
}
