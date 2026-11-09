import mongoose from "mongoose"
import MedioDeContacto from "../domain/MedioDeContacto.js"
import { TipoMedioContacto } from "../domain/enums/TipoMedioContacto.js"
import { opcionesJSONCon } from "./opcionesJSON.js"

const medioDeContactoSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      required: true,
      enum: Object.values(TipoMedioContacto),
    },
    valor: { type: String, required: true },
  },
  {
    toJSON: opcionesJSONCon((json) => {
      delete json.valor
      return json
    }),
  },
)

medioDeContactoSchema.loadClass(MedioDeContacto)

export default medioDeContactoSchema
