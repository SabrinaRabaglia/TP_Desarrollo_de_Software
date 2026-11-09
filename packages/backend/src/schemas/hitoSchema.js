import mongoose from "mongoose"
import opcionesJSON from "./opcionesJSON.js"
import { Hito } from "../domain/Hito.js"

const hitoSchema = new mongoose.Schema(
  {
    fecha: { type: Date, required: true },
    porcentajeConcrecion: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    descripcion: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "hitos",

    toJSON: opcionesJSON,
  },
)

hitoSchema.loadClass(Hito)

export default hitoSchema
