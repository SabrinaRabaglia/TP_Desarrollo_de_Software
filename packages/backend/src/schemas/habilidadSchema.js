import mongoose from "mongoose"
import Habilidad from "../domain/Habilidad.js"
import opcionesJSON from "./opcionesJSON.js"

const habilidadSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true },
    codigo: { type: String, required: true, unique: true },
    descripcion: { type: String, required: true },
  },
  { timestamps: true, collection: "habilidades", toJSON: opcionesJSON },
)

habilidadSchema.loadClass(Habilidad)

export default mongoose.model("Habilidad", habilidadSchema)
