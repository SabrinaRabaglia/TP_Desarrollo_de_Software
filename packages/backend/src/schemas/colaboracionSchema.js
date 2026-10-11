import mongoose from "mongoose"
import Colaboracion from "../domain/Colaboracion.js"
import opcionesJSON from "./opcionesJSON.js"

const colaboracionSchema = new mongoose.Schema(
  {
    fechaInscripcion: { type: Date, required: true },
    esAnonima: {type: Boolean,required:true,default: false},
    personaColaboradora: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PersonaColaboradora",
      required: true,
    },
    proyecto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proyecto",
      required: true,
    },
  },
  { timestamps: true, collection: "colaboraciones", toJSON: opcionesJSON },
)

colaboracionSchema.set("toJSON",{
  ...opcionesJSON,
  //Función 'transform' que se ejecuta cada vez que el documento de Mongoose se convierte a JSON
  transform:(ret)=>{
  
  if (ret.esAnonima) {
    ret.personaColaboradora = null 
  }

  return ret}
})

colaboracionSchema.index(
  { personaColaboradora: 1, proyecto: 1 },
  { unique: true },
)

colaboracionSchema.loadClass(Colaboracion)

export default mongoose.model("Colaboracion", colaboracionSchema)
