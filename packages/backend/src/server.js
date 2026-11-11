import "dotenv/config"
import app from "./app.js"
import MongoDBClient from "./config/database.js"
import sembrarCatalogos from "./seeds/catalogos.js"
import asignarIdsAMediosDeContacto from "./migraciones/asignarIdsAMediosDeContacto.js"
import { usaSecretoDeDesarrollo } from "./auth/tokens.js"
import { envioDeNotificaciones, mediosSimulados } from "./dependencias.js"

const port = process.env.SERVER_PORT || 8000
const intervaloDeEnvio =
  Number(process.env.NOTIFICACIONES_INTERVALO_MS) || 30_000

if (usaSecretoDeDesarrollo()) {
  console.warn(
    "JWT_SECRET no está configurado: los tokens se firman con un secreto de desarrollo. En producción el servidor no arranca sin él.",
  )
}

await MongoDBClient.connect()
await sembrarCatalogos()

const mediosReparados = await asignarIdsAMediosDeContacto()
if (mediosReparados > 0) {
  console.log(
    `Se asignó un id a ${mediosReparados} medios de contacto que estaban guardados sin él.`,
  )
}

if (mediosSimulados.length > 0) {
  console.warn(
    `Notificaciones simuladas por consola para: ${mediosSimulados.join(", ")}. Configurá SMTP_* y TELEGRAM_BOT_TOKEN para enviarlas de verdad.`,
  )
}

setInterval(envioDeNotificaciones.despertar, intervaloDeEnvio).unref()
envioDeNotificaciones.despertar()

app.listen(port, () => {
  console.log(`Backend escuchando en puerto ${port}`)
})
