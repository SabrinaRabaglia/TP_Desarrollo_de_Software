import mongoose from "mongoose"
import Usuario from "../domain/Usuario.js"
import { RolUsuario } from "../domain/enums/RolUsuario.js"
import { opcionesJSONCon } from "./opcionesJSON.js"

// entidad apunta a un Colectivo o a una PersonaColaboradora según el rol. No
// lleva ref porque el nombre público lo resuelve AuthService con el
// repositorio que corresponde a cada rol.
const usuarioSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    hashContrasena: { type: String, required: true },
    rol: { type: String, required: true, enum: Object.values(RolUsuario) },
    entidad: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  {
    timestamps: true,
    collection: "usuarios",
    toJSON: opcionesJSONCon((json) => {
      delete json.hashContrasena
      return json
    }),
  },
)

usuarioSchema.loadClass(Usuario)

export default mongoose.model("Usuario", usuarioSchema)
