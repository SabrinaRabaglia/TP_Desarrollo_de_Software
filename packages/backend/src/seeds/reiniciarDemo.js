import "dotenv/config"
import mongoose from "mongoose"
import MongoDBClient from "../config/database.js"
import { EstadoPostulacion } from "../domain/enums/EstadoPostulacion.js"
import NotificacionModel from "../schemas/notificacionSchema.js"
import PersonaColaboradoraModel from "../schemas/personaColaboradoraSchema.js"
import PostulacionModel from "../schemas/postulacionSchema.js"
import ProyectoModel from "../schemas/proyectoSchema.js"

// Los perfiles que se usan en los tres flujos y en los casos borde, como los
// deja el seed. Las personas que no figuran acá quedan sin postulación.
const PUNTOS_DE_PARTIDA = [
  {
    proyecto: "Mapa de comedores comunitarios",
    perfil: "Tester",
    descripcion: "Probar el mapa de punta a punta antes de cada entrega",
    limiteColaboraciones: 1,
    pendientes: ["Pampa"],
    aceptadas: [],
  },
  {
    proyecto: "Mapa de comedores comunitarios",
    perfil: "Analista de Datos",
    descripcion: "Analizar la demanda de cada comedor de la red",
    limiteColaboraciones: null,
    pendientes: [],
    aceptadas: [],
  },
  {
    proyecto: "Sistema de reservas del salón comunitario",
    perfil: "Desarrollador/a Web",
    descripcion: "Construir la pantalla de reservas y su API",
    limiteColaboraciones: null,
    pendientes: [],
    aceptadas: [],
  },
  {
    proyecto: "Portal de voluntariados",
    perfil: "QA Automation",
    descripcion: "Automatizar las pruebas del alta de voluntariados",
    limiteColaboraciones: 3,
    pendientes: [],
    aceptadas: ["Ceibo", "Hornero"],
  },
]

const SIN_BAJA = { fechaBaja: null, origenBaja: null }

// Busca todo lo que el punto de partida necesita antes de tocar nada: si falta
// algo, el reinicio no queda por la mitad.
const resolver = async ({ proyecto, perfil: nombre, ...partida }) => {
  const perfil = (
    await ProyectoModel.findOne({ titulo: proyecto })
  )?.perfiles.find((candidato) => candidato.nombre === nombre)
  const idsDe = (nombres) =>
    PersonaColaboradoraModel.find({
      nombreFantasia: { $in: nombres },
    }).distinct("_id")
  const [pendientes, aceptadas] = await Promise.all([
    idsDe(partida.pendientes),
    idsDe(partida.aceptadas),
  ])
  const seQuedan = [...pendientes, ...aceptadas]
  const esperadas = partida.pendientes.length + partida.aceptadas.length
  const sembradas =
    perfil &&
    (await PostulacionModel.countDocuments({
      perfil: perfil._id,
      personaColaboradora: { $in: seQuedan },
    }))
  if (!perfil || seQuedan.length !== esperadas || sembradas !== esperadas) {
    throw new Error(
      `Faltan los datos de prueba del perfil ${nombre}. ¿Corriste npm run seed:backend?`,
    )
  }
  return { ...partida, nombre, perfil: perfil._id, pendientes, aceptadas }
}

const reiniciar = async (partida) => {
  const { perfil, pendientes, aceptadas } = partida
  const deLasPersonas = (ids) => ({ perfil, personaColaboradora: { $in: ids } })

  const { deletedCount: postulaciones } = await PostulacionModel.deleteMany({
    perfil,
    personaColaboradora: { $nin: [...pendientes, ...aceptadas] },
  })
  await PostulacionModel.updateMany(deLasPersonas(pendientes), {
    $set: {
      estado: EstadoPostulacion.PENDIENTE,
      fechaRevision: null,
      ...SIN_BAJA,
    },
  })
  await PostulacionModel.updateMany(deLasPersonas(aceptadas), {
    $set: { estado: EstadoPostulacion.ACEPTADA, ...SIN_BAJA },
  })
  await ProyectoModel.updateOne(
    { "perfiles._id": perfil },
    {
      $set: {
        "perfiles.$.descripcion": partida.descripcion,
        "perfiles.$.limiteColaboraciones": partida.limiteColaboraciones,
        "perfiles.$.busquedaAbierta": true,
        "perfiles.$.busquedaAbiertaHasta": null,
        "perfiles.$.postulacionesAceptadas": await PostulacionModel.find(
          deLasPersonas(aceptadas),
        ).distinct("_id"),
      },
    },
  )
  const { deletedCount: mensajes } = await NotificacionModel.deleteMany({
    perfil,
  })

  return `${partida.nombre}: ${postulaciones} postulaciones y ${mensajes} mensajes borrados`
}

// Para repetir la demo. Es el único comando que borra algo, y solo borra
// postulaciones y mensajes de estos perfiles.
await MongoDBClient.connect()
try {
  const partidas = await Promise.all(PUNTOS_DE_PARTIDA.map(resolver))
  for (const partida of partidas) {
    console.log(await reiniciar(partida))
  }
  console.log("Demo reiniciada: los perfiles quedaron como los deja el seed.")
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
