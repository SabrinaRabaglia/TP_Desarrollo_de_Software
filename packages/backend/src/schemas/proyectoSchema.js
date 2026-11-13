import mongoose from "mongoose"
import Proyecto from "../domain/Proyecto.js"
import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js"
import opcionesJSON from "./opcionesJSON.js"
import perfilSchema from "./perfilSchema.js"
import hitoSchema from "./hitoSchema.js"

const proyectoSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, unique: true },
    descripcion: { type: String, required: true },
    estado: {
      type: String,
      enum: Object.values(EstadoProyecto),
      default: EstadoProyecto.PUBLICADO,
    },
    fechaAlta: { type: Date, required: true },
    fechaCierre: { type: Date, default: null },
    colectivo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Colectivo",
      required: true,
    },
    perfiles: [perfilSchema],
    hitos: [hitoSchema],
    enlaceSistemaEnFuncionamiento: { type: String, default: null },
    enlaceCodigoFuente: { type: String, default: null },
    busquedaAbierta: { type: Boolean, default: false },
    busquedaAbiertaHasta: { type: Date, default: null },
  },
  { timestamps: true, collection: "proyectos", toJSON: opcionesJSON },
)

proyectoSchema.loadClass(Proyecto)

export default mongoose.model("Proyecto", proyectoSchema)
