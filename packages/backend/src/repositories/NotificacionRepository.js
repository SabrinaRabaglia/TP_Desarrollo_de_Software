import NotificacionModel from "../schemas/notificacionSchema.js"
import guardar from "./guardar.js"

export default class NotificacionRepository {
  constructor() {
    this.model = NotificacionModel
  }

  async findByPersonaColaboradora(personaColaboradoraId) {
    return await this.model
      .find({ personaColaboradora: personaColaboradoraId })
      .sort({ fecha: -1 })
  }

  async deleteByPersonaColaboradora(personaColaboradoraId) {
    await this.model.deleteMany({ personaColaboradora: personaColaboradoraId })
  }

  async save(notificacion) {
    const guardada = await guardar(this.model, notificacion)
    return guardada.depopulate()
  }
}
