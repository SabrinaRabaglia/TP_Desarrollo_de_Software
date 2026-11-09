import mongoose from "mongoose"
import Colectivo from "../domain/Colectivo.js"
import opcionesJSON from "./opcionesJSON.js"

const colectivoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true },
    descripcion: { type: String, required: true },
    tipo: { type: String, required: true },
    pais: { type: mongoose.Schema.Types.ObjectId, ref: "Pais", default: null },
    provincia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provincia",
      default: null,
    },
    ciudad: { type: String, default: null },
  },
  { timestamps: true, collection: "colectivos", toJSON: opcionesJSON },
)

colectivoSchema.virtual("proyectos", {
  ref: "Proyecto",
  localField: "_id",
  foreignField: "colectivo",
})

colectivoSchema.loadClass(Colectivo)

export default mongoose.model("Colectivo", colectivoSchema)
