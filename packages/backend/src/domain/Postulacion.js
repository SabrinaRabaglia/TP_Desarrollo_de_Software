import { EstadoPostulacion } from "./enums/EstadoPostulacion.js"
import { OrigenBaja } from "./enums/OrigenBaja.js"
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

  // Desanotar es dejar de colaborar: solo se da de baja una postulación
  // aceptada, y la baja es permanente.
  darDeBaja(origen) {
    if (!Object.values(OrigenBaja).includes(origen)) {
      throw new DomainValidationError("El origen de la baja es inválido.")
    }
    if (this.estado !== EstadoPostulacion.ACEPTADA) {
      throw new DomainRuleError(
        "Solo se pueden dar de baja postulaciones aceptadas",
      )
    }

    this.estado = EstadoPostulacion.BAJA
    this.fechaBaja = new Date()
    this.origenBaja = origen
  }
}
