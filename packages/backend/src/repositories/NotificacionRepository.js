import NotificacionModel from "../schemas/notificacionSchema.js"
import { EstadoEnvio } from "../domain/enums/EstadoEnvio.js"
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

  async reclamarPendiente(ahora, bloqueoVencidoAntesDe) {
    return await this.model.findOneAndUpdate(
      {
        "envios.estado": EstadoEnvio.PENDIENTE,
        $and: [
          {
            $or: [
              { procesandoDesde: null },
              { procesandoDesde: { $lt: bloqueoVencidoAntesDe } },
            ],
          },
          {
            $or: [
              { reintentarDesde: null },
              { reintentarDesde: { $lte: ahora } },
            ],
          },
        ],
      },
      { $set: { procesandoDesde: ahora } },
      { new: true, sort: { fecha: 1 } },
    )
  }

  async liberar(notificacion, reclamadaEn) {
    const { matchedCount } = await this.model.updateOne(
      { _id: notificacion._id, procesandoDesde: reclamadaEn },
      {
        $set: {
          envios: notificacion.envios,
          procesandoDesde: null,
          reintentarDesde: notificacion.reintentarDesde,
        },
      },
    )
    return matchedCount === 1
  }

  async save(notificacion) {
    const guardada = await guardar(this.model, notificacion)
    return guardada.depopulate()
  }
}
