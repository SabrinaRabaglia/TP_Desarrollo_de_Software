import { EstadoPostulacion } from "./enums/EstadoPostulacion.js"
import {
  DomainRuleError,
  DomainValidationError,
} from "./errors/DomainErrors.js"

export default class Postulacion {
    constructor(personaColaboradora, perfil, esAnonima = false) {
        if (!personaColaboradora || !perfil) {
              throw new DomainValidationError(
                "La postulacion debe tener una persona colaboradora y un perfil asociados.",
              )
            }
            if (!perfil.estaCubiertoPor(personaColaboradora.habilidades)) {
              throw new DomainRuleError(
                "La persona debe cumplir con las habilidades requeridas.",
              )
            }
        this.fechaPostulacion = new Date()
        this.fechaRevision = null
        this.estado = EstadoPostulacion.PENDIENTE
        this.esAnonima = esAnonima
        this.fechaBaja = null
        this.origenBaja = null
        this.personaColaboradora = personaColaboradora
        this.perfil = perfil
    }
    
    aceptar() {
    if (this.estado !== EstadoPostulacion.PENDIENTE) {
      throw new DomainRuleError(
        "Solo se pueden aceptar postulaciones pendientes",
      )
    }

    this.estado = EstadoPostulacion.ACEPTADA
    this.fechaRevision = new Date()
  }

    rechazar() {
      if (this.estado !== EstadoPostulacion.PENDIENTE) {
        throw new DomainRuleError(
          "Solo se pueden rechazar postulaciones pendientes",
        )
      }

      this.estado = EstadoPostulacion.RECHAZADA
      this.fechaRevision = new Date()
    }
}