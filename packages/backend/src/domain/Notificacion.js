import { DomainValidationError } from "./errors/DomainErrors.js"

export default class Notificacion {
  constructor({ contenido, colectivo, personaColaboradora, perfil }) {
    Notificacion.validarDatos({
      contenido,
      colectivo,
      personaColaboradora,
      perfil,
    })
    this.fecha = new Date()
    this.contenido = contenido
    this.colectivo = colectivo
    this.personaColaboradora = personaColaboradora
    this.perfil = perfil
    this.mediosExternosUtilizados = []
  }

  static validarDatos({ contenido, colectivo, personaColaboradora, perfil }) {
    if (!contenido?.trim()) {
      throw new DomainValidationError("La notificación debe tener contenido.")
    }
    if (!colectivo || !personaColaboradora || !perfil) {
      throw new DomainValidationError(
        "La notificación debe indicar colectivo, persona colaboradora y perfil.",
      )
    }
  }

  registrarMediosExternos(medios) {
    this.mediosExternosUtilizados = medios
  }
}
