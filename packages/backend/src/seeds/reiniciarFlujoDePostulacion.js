import "dotenv/config"
import mongoose from "mongoose"
import MongoDBClient from "../config/database.js"
import { EstadoPostulacion } from "../domain/enums/EstadoPostulacion.js"
import PersonaColaboradoraModel from "../schemas/personaColaboradoraSchema.js"
import PostulacionModel from "../schemas/postulacionSchema.js"
import ProyectoModel from "../schemas/proyectoSchema.js"

// Para repetir la demo del flujo de postulación: vuelve al punto de partida
// que carga el seed (Nube sin postulación, Pampa pendiente, Tester sin lugares
// ocupados). No toca ningún otro dato.
await MongoDBClient.connect()

const proyecto = await ProyectoModel.findOne({
  titulo: "Mapa de comedores comunitarios",
})
const tester = proyecto?.perfiles.find((perfil) => perfil.nombre === "Tester")
const [nube, pampa] = await Promise.all(
  ["Nube", "Pampa"].map((nombreFantasia) =>
    PersonaColaboradoraModel.findOne({ nombreFantasia }),
  ),
)
if (!tester || !nube || !pampa) {
  console.error(
    "Faltan los datos de prueba del flujo. ¿Corriste npm run seed:backend?",
  )
  await mongoose.disconnect()
  process.exit(1)
}

const { deletedCount } = await PostulacionModel.deleteMany({
  perfil: tester._id,
  personaColaboradora: nube._id,
})
await PostulacionModel.updateOne(
  { perfil: tester._id, personaColaboradora: pampa._id },
  {
    $set: {
      estado: EstadoPostulacion.PENDIENTE,
      fechaRevision: null,
      fechaBaja: null,
      origenBaja: null,
    },
    $setOnInsert: { fechaPostulacion: new Date(), esAnonima: false },
  },
  { upsert: true },
)
await ProyectoModel.updateOne(
  { "perfiles._id": tester._id },
  { $set: { "perfiles.$.postulacionesAceptadas": [] } },
)

console.log(
  `Flujo de postulación reiniciado: Nube sin postulación (${deletedCount} borrada), Pampa pendiente y Tester sin lugares ocupados.`,
)
await mongoose.disconnect()
