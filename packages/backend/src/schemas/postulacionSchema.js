import mongoose from "mongoose"
import Postulacion from "../domain/Postulacion.js"
import { opcionesJSONCon } from "./opcionesJSON.js"
import { EstadoPostulacion } from "../domain/enums/EstadoPostulacion.js"
import { OrigenBaja } from "../domain/enums/OrigenBaja.js"

const postulacionSchema = new mongoose.Schema(
  {
    fechaPostulacion: { type: Date, required: true },
    fechaRevision: { type: Date, default: null },
    estado: {
      type: String,
      enum: Object.values(EstadoPostulacion),
      default: EstadoPostulacion.PENDIENTE,
    },
    esAnonima: { type: Boolean, required: true, default: false },
    fechaBaja: { type: Date, default: null },
    origenBaja: {
      type: String,
      enum: Object.values(OrigenBaja),
      default: null,
    },
    personaColaboradora: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PersonaColaboradora",
      required: true,
    },
    perfil: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "postulaciones",
    toJSON: opcionesJSONCon((json) =>
      json.esAnonima ? { ...json, personaColaboradora: null } : json,
    ),
  },
)

postulacionSchema.index({ personaColaboradora: 1, perfil: 1 }, { unique: true })

postulacionSchema.loadClass(Postulacion)

export default mongoose.model("Postulacion", postulacionSchema)
