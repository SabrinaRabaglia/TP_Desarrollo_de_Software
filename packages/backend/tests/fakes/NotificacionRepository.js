import { randomUUID } from "node:crypto"

export default class NotificacionRepository {
  constructor() {
    this.notificaciones = []
  }

  async findByPersonaColaboradora(personaColaboradoraId) {
    return this.notificaciones
      .filter(
        (notificacion) =>
          notificacion.personaColaboradora.id === personaColaboradoraId,
      )
      .toSorted((a, b) => b.fecha - a.fecha)
  }

  async deleteByPersonaColaboradora(personaColaboradoraId) {
    this.notificaciones = this.notificaciones.filter(
      (notificacion) =>
        notificacion.personaColaboradora.id !== personaColaboradoraId,
    )
  }

  async save(notificacion) {
    notificacion.id ??= randomUUID()
    this.notificaciones.push(notificacion)
    return notificacion
  }
}
