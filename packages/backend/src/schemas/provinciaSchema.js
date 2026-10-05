import mongoose from "mongoose"
import Provincia from "../domain/Provincia.js"
import opcionesJSON from "./opcionesJSON.js"

const provinciaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true },
  },
  { timestamps: true, collection: "provincias", toJSON: opcionesJSON },
)

provinciaSchema.loadClass(Provincia)

export default mongoose.model("Provincia", provinciaSchema)
