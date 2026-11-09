import "dotenv/config"
import mongoose from "mongoose"
import Usuario from "../domain/Usuario.js"
import UsuarioRepository from "../repositories/UsuarioRepository.js"
import { firmar } from "../auth/tokens.js"

const email = process.argv[2]
if (!email) {
  console.error("Uso: npm run token --workspace=backend -- <email>")
  process.exit(1)
}

// Sin MongoDBClient: su log de conexión saldría por stdout junto con el token.
await mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.MONGODB_DB_NAME,
})
const usuario = await new UsuarioRepository().findByEmail(
  Usuario.normalizarEmail(email),
)
await mongoose.disconnect()

if (!usuario) {
  console.error(
    `No hay un usuario con el email ${email}. ¿Corriste npm run seed:backend?`,
  )
  process.exit(1)
}
console.log(firmar(usuario))
