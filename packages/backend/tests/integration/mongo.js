import "dotenv/config"
import mongoose from "mongoose"
import sembrarCatalogos from "../../src/seeds/catalogos.js"

// Una base por archivo: jest corre los archivos en paralelo y cada uno la borra.
export const conectar = async (archivo) => {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: `codigo-a-voluntad-test-${archivo}`,
    autoIndex: false,
  })
  await mongoose.connection.dropDatabase()
  await Promise.all(
    mongoose
      .modelNames()
      .map((nombre) => mongoose.model(nombre).createIndexes()),
  )
  await sembrarCatalogos()
}

export const desconectar = async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
}
