import mongoose from "mongoose"
import opcionesJSON from "./opcionesJSON.js"
import Notificacion from "../domain/Notificacion.js"
import medioDeContactoSchema from "./medioDeContactoSchema.js"


const notificacionSchema = new mongoose.Schema(
    {
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
            },
        perfil: {
              type: mongoose.Schema.Types.ObjectId,
              required: true,
        },
        fecha: { type: Date, required: true, default: Date.now},
        mediosExternosUtilizados: [medioDeContactoSchema]
    },
    { timestamps: true, collection: "notificaciones", toJSON: opcionesJSON }
)

notificacionSchema.loadClass(Notificacion)

export default mongoose.model("notificacion", notificacionSchema)
