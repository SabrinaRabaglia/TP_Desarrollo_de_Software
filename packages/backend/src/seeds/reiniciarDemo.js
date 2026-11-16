import "dotenv/config"
import mongoose from "mongoose"
import MongoDBClient from "../config/database.js"
import { EstadoPostulacion } from "../domain/enums/EstadoPostulacion.js"
import ColectivoModel from "../schemas/colectivoSchema.js"
import NotificacionModel from "../schemas/notificacionSchema.js"
import PersonaColaboradoraModel from "../schemas/personaColaboradoraSchema.js"
import PostulacionModel from "../schemas/postulacionSchema.js"
import ProyectoModel from "../schemas/proyectoSchema.js"
import UsuarioModel from "../schemas/usuarioSchema.js"
import { EMAILS_DE_PRUEBA, PROYECTOS_DE_PRUEBA } from "./datosDePrueba.js"

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

const ids = (documentos) => documentos.map(({ _id }) => _id)

// Lo que se creó en un ensayo y el seed no conoce: proyectos, colectivos y
// personas. Si falta algo del seed no devuelve nada y falla, para no tomar
// por ajeno un dato de prueba.
const buscarLoAjeno = async () => {
  const delSeed = await UsuarioModel.find({
    email: { $in: EMAILS_DE_PRUEBA },
  }).distinct("entidad")
  const proyectosDelSeed = await ProyectoModel.distinct("titulo", {
    titulo: { $in: PROYECTOS_DE_PRUEBA },
  })
  if (
    delSeed.length !== EMAILS_DE_PRUEBA.length ||
    proyectosDelSeed.length !== PROYECTOS_DE_PRUEBA.length
  ) {
    throw new Error(
      "Faltan usuarios o proyectos de prueba. ¿Corriste npm run seed:backend?",
    )
  }
  const ajenos = { _id: { $nin: delSeed } }
  const [proyectos, colectivos, personas] = await Promise.all([
    ProyectoModel.find({
      $or: [
        { titulo: { $nin: PROYECTOS_DE_PRUEBA } },
        { colectivo: { $nin: delSeed } },
      ],
    }),
    ColectivoModel.find(ajenos),
    PersonaColaboradoraModel.find(ajenos),
  ])
  return { delSeed, proyectos, colectivos, personas }
}

const nombres = (documentos, campo) =>
  documentos.map((documento) => documento[campo]).join(", ") || "ninguno"

const describir = ({ proyectos, colectivos, personas }) =>
  [
    `Proyectos fuera del seed: ${nombres(proyectos, "titulo")}`,
    `Colectivos fuera del seed: ${nombres(colectivos, "nombre")}`,
    `Personas fuera del seed: ${nombres(personas, "nombreFantasia")}`,
  ].join("\n")

const borrar = async ({ delSeed, proyectos, colectivos, personas }) => {
  const deLoAjeno = [
    { perfil: { $in: proyectos.flatMap(({ perfiles }) => ids(perfiles)) } },
    { personaColaboradora: { $in: ids(personas) } },
  ]
  const postulaciones = await PostulacionModel.find({
    $or: deLoAjeno,
  }).distinct("_id")
  await PostulacionModel.deleteMany({ _id: { $in: postulaciones } })
  await NotificacionModel.deleteMany({
    $or: [...deLoAjeno, { colectivo: { $in: ids(colectivos) } }],
  })
  await ProyectoModel.deleteMany({ _id: { $in: ids(proyectos) } })
  // Una persona borrada deja de ocupar lugar en los perfiles que quedan.
  await ProyectoModel.updateMany(
    {},
    {
      $pull: { "perfiles.$[].postulacionesAceptadas": { $in: postulaciones } },
    },
    { timestamps: false },
  )
  await ColectivoModel.deleteMany({ _id: { $in: ids(colectivos) } })
  await PersonaColaboradoraModel.deleteMany({ _id: { $in: ids(personas) } })
  await UsuarioModel.deleteMany({ entidad: { $nin: delSeed } })
}

// Para repetir la demo. Es el único comando que borra algo: lo que no es del
// seed, y las postulaciones y mensajes de los perfiles de la demo. Con
// --simular solo muestra qué borraría de lo que no es del seed.
const soloSimular = process.argv.includes("--simular")
await MongoDBClient.connect()
try {
  const partidas = await Promise.all(PUNTOS_DE_PARTIDA.map(resolver))
  const ajeno = await buscarLoAjeno()
  console.log(describir(ajeno))
  if (soloSimular) {
    console.log("Simulación: no se borró ni se cambió nada.")
  } else {
    await borrar(ajeno)
    for (const partida of partidas) {
      console.log(await reiniciar(partida))
    }
    console.log(
      "Demo reiniciada: quedó solo lo del seed y los perfiles como los deja.",
    )
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
