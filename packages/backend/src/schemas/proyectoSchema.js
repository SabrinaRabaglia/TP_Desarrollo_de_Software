import mongoose from "mongoose"
import Proyecto from "../domain/Proyecto.js"
import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js"
import { ModalidadColaboracion } from "../domain/enums/ModalidadColaboracion.js"
import { UnidadCompromiso } from "../domain/enums/UnidadCompromiso.js"
import opcionesJSON from "./opcionesJSON.js"
import perfilSchema from "./perfilSchema.js"

const proyectoSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, unique: true },
    descripcion: { type: String, required: true },
    unidadCompromiso: {
      type: String,
      required: true,
      enum: Object.values(UnidadCompromiso),
    },
    cantHoras: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "La cantidad de horas debe ser un entero.",
      },
    },
    modalidadesColaboracion: {
      type: [{ type: String, enum: Object.values(ModalidadColaboracion) }],
      validate: {
        validator: (modalidades) => modalidades.length > 0,
        message:
          "El proyecto debe tener al menos una modalidad de colaboración.",
      },
    },
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
    habilidadesRequeridas: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Habilidad" },
    ],
    perfiles: [perfilSchema],
  },
  { timestamps: true, collection: "proyectos", toJSON: opcionesJSON },
)

proyectoSchema.loadClass(Proyecto)

export default mongoose.model("Proyecto", proyectoSchema)
