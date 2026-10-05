import mongoose from "mongoose"
import PersonaColaboradora from "../domain/PersonaColaboradora.js"
import Cuenta from "../domain/Cuenta.js"
import { TipoCuenta } from "../domain/enums/TipoCuenta.js"
import opcionesJSON from "./opcionesJSON.js"

const cuentaSchema = new mongoose.Schema(
  {
    nombreUsuario: { type: String, required: true },
    tipo: { type: String, required: true, enum: Object.values(TipoCuenta) },
  },
  { _id: false, id: false },
)

cuentaSchema.loadClass(Cuenta)

const personaColaboradoraSchema = new mongoose.Schema(
  {
    nombreFantasia: { type: String, required: true },
    nombre: { type: String, default: null },
    apellido: { type: String, default: null },
    pronombres: [String],
    presentacion: { type: String, default: null },
    cuentas: [cuentaSchema],
    habilidades: [{ type: mongoose.Schema.Types.ObjectId, ref: "Habilidad" }],
  },
  {
    timestamps: true,
    collection: "personasColaboradoras",
    toJSON: opcionesJSON,
  },
)

personaColaboradoraSchema.loadClass(PersonaColaboradora)

export default mongoose.model("PersonaColaboradora", personaColaboradoraSchema)
