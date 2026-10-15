import mongoose from "mongoose"
import MedioDeContacto from "../domain/MedioDeContacto.js"

const medioDeContactoSchema = new mongoose.Schema({
    tipo: {
        type: String,
        required: true,
        enum: ["EMAIL", "WHATSAPP", "SMS"]
    },
    valor: {
        type: String,
        required: true
    }
}, { _id: false })

medioDeContactoSchema.loadClass(MedioDeContacto)

export default medioDeContactoSchema