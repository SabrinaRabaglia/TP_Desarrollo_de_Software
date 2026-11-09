import mongoose from "mongoose"
import Notificacion from "../domain/Notificacion.js"
import { EstadoEnvio } from "../domain/enums/EstadoEnvio.js"
import { opcionesJSONCon } from "./opcionesJSON.js"
import medioDeContactoSchema from "./medioDeContactoSchema.js"

const envioSchema = new mongoose.Schema(
  {
    medio: { type: medioDeContactoSchema, required: true },
    estado: {
      type: String,
      enum: Object.values(EstadoEnvio),
      default: EstadoEnvio.PENDIENTE,
    },
    intentos: { type: Number, default: 0 },
    ultimoError: { type: String, default: null },
    enviadoEn: { type: Date, default: null },
  },
  { _id: false },
)

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
    envios: [envioSchema],
    procesandoDesde: { type: Date, default: null },
    reintentarDesde: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "notificaciones",
    toJSON: opcionesJSONCon((json) => {
      delete json.envios
      delete json.procesandoDesde
      delete json.reintentarDesde
      return json
    }),
  },
)

notificacionSchema.index({ "envios.estado": 1, fecha: 1 })

notificacionSchema.loadClass(Notificacion)

export default mongoose.model("Notificacion", notificacionSchema)
