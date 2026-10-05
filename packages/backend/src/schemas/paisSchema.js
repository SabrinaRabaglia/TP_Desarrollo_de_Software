import mongoose from "mongoose"
import Pais from "../domain/Pais.js"
import opcionesJSON from "./opcionesJSON.js"

const paisSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true },
  },
  { timestamps: true, collection: "paises", toJSON: opcionesJSON },
)

paisSchema.loadClass(Pais)

export default mongoose.model("Pais", paisSchema)
