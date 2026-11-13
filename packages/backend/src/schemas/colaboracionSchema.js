import mongoose from "mongoose"
import Colaboracion from "../domain/Colaboracion.js"
import { opcionesJSONCon } from "./opcionesJSON.js"

const colaboracionSchema = new mongoose.Schema(
  {
    fechaInscripcion: { type: Date, required: true },
    esAnonima: { type: Boolean, required: true, default: false },
    personaColaboradora: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PersonaColaboradora",
      required: true,
    },
    proyecto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proyecto",
      required: true,
    },
    perfilId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "colaboraciones",
    toJSON: opcionesJSONCon((json) =>
      json.esAnonima ? { ...json, personaColaboradora: null } : json,
    ),
  },
)

colaboracionSchema.index(
  { personaColaboradora: 1, proyecto: 1 },
  { unique: true },
)

colaboracionSchema.loadClass(Colaboracion)

export default mongoose.model("Colaboracion", colaboracionSchema)
