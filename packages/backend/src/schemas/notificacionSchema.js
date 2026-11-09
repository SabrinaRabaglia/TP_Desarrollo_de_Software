import mongoose from "mongoose"
import Notificacion from "../domain/Notificacion.js"
import { opcionesJSONCon } from "./opcionesJSON.js"
import medioDeContactoSchema from "./medioDeContactoSchema.js"

const notificacionSchema = new mongoose.Schema(
  {
    fecha: { type: Date, required: true },
    contenido: { type: String, required: true },
    colectivo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Colectivo",
      required: true,
    },
    personaColaboradora: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PersonaColaboradora",
      required: true,
      index: true,
    },
    perfil: { type: mongoose.Schema.Types.ObjectId, required: true },
    mediosExternosUtilizados: [medioDeContactoSchema],
  },
  {
    timestamps: true,
    collection: "notificaciones",
    toJSON: opcionesJSONCon((json) => ({
      ...json,
      mediosExternosUtilizados: (json.mediosExternosUtilizados ?? []).map(
        (medio) => medio.tipo,
      ),
    })),
  },
)

notificacionSchema.loadClass(Notificacion)

export default mongoose.model("Notificacion", notificacionSchema)
