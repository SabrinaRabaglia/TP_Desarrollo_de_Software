import mongoose from "mongoose"
import TipoColectivo from "../domain/TipoColectivo.js"
import opcionesJSON from "./opcionesJSON.js"

const tipoColectivoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true },
  },
  { timestamps: true, collection: "tiposColectivo", toJSON: opcionesJSON },
)

tipoColectivoSchema.loadClass(TipoColectivo)

export default mongoose.model("TipoColectivo", tipoColectivoSchema)
