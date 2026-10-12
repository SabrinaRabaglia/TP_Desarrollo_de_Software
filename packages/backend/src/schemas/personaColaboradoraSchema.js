import mongoose from "mongoose"
import PersonaColaboradora from "../domain/PersonaColaboradora.js"
import Cuenta from "../domain/Cuenta.js"
import { TipoCuenta } from "../domain/enums/TipoCuenta.js"
import { TipoMedioContacto } from "../domain/enums/TipoMedioContacto.js"
import opcionesJSON from "./opcionesJSON.js"

const cuentaSchema = new mongoose.Schema(
  {
    nombreUsuario: { type: String, required: true },
    tipo: { type: String, required: true, enum: Object.values(TipoCuenta) },
  },
  { _id: false, id: false },
)

cuentaSchema.loadClass(Cuenta)

const medioDeContactoSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      required: true,
      enum: Object.values(TipoMedioContacto),
    },
    valor: { type: String, required: true },
  },
  { _id: false },
)

const personaColaboradoraSchema = new mongoose.Schema(
  {
    nombreFantasia: { type: String, required: true },
    nombre: { type: String, default: null },
    apellido: { type: String, default: null },
    pronombres: [String],
    presentacion: { type: String, default: null },
    cuentas: [cuentaSchema],
    habilidades: [{ type: mongoose.Schema.Types.ObjectId, ref: "Habilidad" }],
    aceptaMensajeriaInterna: { type: Boolean, default: false },
    mediosDeContacto: [medioDeContactoSchema],
  },
  {
    timestamps: true,
    collection: "personasColaboradoras",
    toJSON: {
      ...opcionesJSON,
      transform: (documento, json) => {
        opcionesJSON.transform(documento, json)
        delete json.mediosDeContacto
        return json
      },
    },
  },
)

personaColaboradoraSchema.loadClass(PersonaColaboradora)

export default mongoose.model("PersonaColaboradora", personaColaboradoraSchema)
