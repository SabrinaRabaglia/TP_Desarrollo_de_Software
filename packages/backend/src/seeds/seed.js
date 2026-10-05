import "dotenv/config"
import mongoose from "mongoose"
import MongoDBClient from "../config/database.js"
import sembrarCatalogos from "./catalogos.js"
import sembrarDatosDePrueba from "./datosDePrueba.js"

await MongoDBClient.connect()
await sembrarCatalogos()
await sembrarDatosDePrueba()
console.log("Seed completo")
await mongoose.disconnect()
