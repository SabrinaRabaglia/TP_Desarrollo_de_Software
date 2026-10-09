import mongoose from "mongoose"
import Perfil from "../domain/Perfil.js"
import { UnidadCompromiso } from "../domain/enums/UnidadCompromiso.js"
import { ModalidadColaboracion } from "../domain/enums/ModalidadColaboracion.js"

const perfilSchema = new mongoose.Schema({
  nombre: { type: String, default: null },
  descripcion: { type: String, required: true },
  unidadCompromiso: {
    type: String,
    enum: Object.values(UnidadCompromiso),
    default: null,
  },
  cantidadHoras: { type: Number, default: null },
  modalidadesColaboracion: [
    { type: String, enum: Object.values(ModalidadColaboracion) },
  ],
  habilidadesRequeridas: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Habilidad" },
  ],
  habilidadesOpcionales: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Habilidad" },
  ],
})

perfilSchema.loadClass(Perfil)

export default perfilSchema
