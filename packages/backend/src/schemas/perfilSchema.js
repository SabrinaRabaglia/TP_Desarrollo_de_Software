import mongoose from "mongoose"
import Perfil from "../domain/Perfil.js"
import { ModalidadColaboracion } from "../domain/enums/ModalidadColaboracion.js"
import { UnidadCompromiso } from "../domain/enums/UnidadCompromiso.js"
import opcionesJSON from "./opcionesJSON.js"

const perfilSchema = new mongoose.Schema(
  {
    nombre: { type: String, default: null },
    descripcion: { type: String, required: true },
    unidadCompromiso: {
      type: String,
      required: true,
      enum: Object.values(UnidadCompromiso),
    },
    cantidadHoras: { type: Number, required: true },
    modalidadesColaboracion: [
      { type: String, enum: Object.values(ModalidadColaboracion) },
    ],
    habilidadesRequeridas: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Habilidad" },
    ],
    habilidadesOpcionales: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Habilidad" },
    ],
    limiteColaboraciones: { type: Number, default: null },
  },
  { toJSON: opcionesJSON },
)

perfilSchema.loadClass(Perfil)

export default perfilSchema
