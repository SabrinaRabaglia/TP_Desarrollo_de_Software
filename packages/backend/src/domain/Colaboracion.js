import {
  DomainRuleError,
  DomainValidationError,
} from "./errors/DomainErrors.js"

export default class Colaboracion {
  constructor(personaColaboradora, proyecto, esAnonima = false) {
    if (!personaColaboradora || !proyecto) {
      throw new DomainValidationError(
        "La colaboración debe tener una persona colaboradora y un proyecto asociados.",
      )
    }
    if (proyecto.proyectoCerrado()) {
      throw new DomainRuleError("El proyecto no acepta nuevos colaboradores.")
    }
    if (!proyecto.poseeHabilidadNecesaria(personaColaboradora)) {
      throw new DomainRuleError(
        "La persona debe poseer al menos una habilidad requerida.",
      )
    }
    this.fechaInscripcion = new Date()
    this.personaColaboradora = personaColaboradora
    this.proyecto = proyecto
    this.esAnonima = esAnonima
  }
}
