import "dotenv/config"
import app from "./app.js"
import MongoDBClient from "./config/database.js"
import sembrarCatalogos from "./seeds/catalogos.js"

const port = process.env.SERVER_PORT || 8000

await MongoDBClient.connect()
await sembrarCatalogos()

app.listen(port, () => {
  console.log(`Backend escuchando en puerto ${port}`)
})
