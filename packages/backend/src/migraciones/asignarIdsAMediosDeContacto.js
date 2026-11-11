import mongoose from "mongoose"
import PersonaColaboradoraModel from "../schemas/personaColaboradoraSchema.js"

const CON_ALGUN_MEDIO_SIN_ID = {
  mediosDeContacto: { $elemMatch: { _id: { $exists: false } } },
}

// Hasta el 8/11/2026 los medios de contacto se guardaban sin _id. Mongoose le
// inventa uno distinto en cada lectura a los que quedaron así, y por eso no se
// los puede borrar por id. Va por el driver, de a un medio, para que cada uno
// reciba su propio id.
export default async function asignarIdsAMediosDeContacto() {
  let reparados = 0
  for (;;) {
    const { modifiedCount } =
      await PersonaColaboradoraModel.collection.updateOne(
        CON_ALGUN_MEDIO_SIN_ID,
        { $set: { "mediosDeContacto.$._id": new mongoose.Types.ObjectId() } },
      )
    if (modifiedCount === 0) {
      return reparados
    }
    reparados += 1
  }
}
