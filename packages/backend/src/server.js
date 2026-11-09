import "dotenv/config"
import app from "./app.js"
import MongoDBClient from "./config/database.js"
import sembrarCatalogos from "./seeds/catalogos.js"
import { envioDeNotificaciones, mediosSimulados } from "./dependencias.js"

const port = process.env.SERVER_PORT || 8000
const intervaloDeEnvio =
  Number(process.env.NOTIFICACIONES_INTERVALO_MS) || 30_000

await MongoDBClient.connect()
await sembrarCatalogos()

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
