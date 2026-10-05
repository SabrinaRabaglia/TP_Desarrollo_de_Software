import mongoose from "mongoose"

export default class MongoDBClient {
  static async connect() {
    try {
      // dbName aparte: concatenar "/<db>?authSource=admin" a la URI rompe las URIs de Atlas/Cosmos.
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        dbName: process.env.MONGODB_DB_NAME,
      })
      console.log(`MongoDB conectado: ${conn.connection.host}`)
    } catch (error) {
      console.error(`Error al conectar con MongoDB: ${error.message}`)
      process.exit(1)
    }
  }
}
