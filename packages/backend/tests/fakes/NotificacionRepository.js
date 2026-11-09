import { randomUUID } from "node:crypto"

export default class NotificacionRepository {
  constructor() {
    this.notificaciones = []
    this.reclamos = new Map()
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

  async reclamarPendiente(ahora, bloqueoVencidoAntesDe) {
    const notificacion = this.notificaciones
      .toSorted((a, b) => a.fecha - b.fecha)
      .find(
        (candidata) =>
          candidata.pendienteDeEnvio &&
          (candidata.procesandoDesde === null ||
            candidata.procesandoDesde < bloqueoVencidoAntesDe) &&
          (candidata.reintentarDesde === null ||
            candidata.reintentarDesde <= ahora),
      )
    if (!notificacion) {
      return null
    }
    notificacion.procesandoDesde = ahora
    this.reclamos.set(notificacion.id, ahora)
    return notificacion
  }

  async liberar(notificacion, reclamadaEn) {
    if (this.reclamos.get(notificacion.id) !== reclamadaEn) {
      return false
    }
    this.reclamos.delete(notificacion.id)
    return true
  }

  async save(notificacion) {
    notificacion.id ??= randomUUID()
    if (!this.notificaciones.includes(notificacion)) {
      this.notificaciones.push(notificacion)
    }
    return notificacion
  }
}
