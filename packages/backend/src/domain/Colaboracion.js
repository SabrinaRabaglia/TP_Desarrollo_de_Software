import {
  DomainRuleError,
  DomainValidationError,
} from "./errors/DomainErrors.js"

export default class Colaboracion {
  constructor(
    personaColaboradora,
    proyecto,
    esAnonima = false,
    perfilId = null,
  ) {
    if (!personaColaboradora || !proyecto) {
      throw new DomainValidationError(
        "La colaboración debe tener una persona colaboradora y un proyecto asociados.",
      )
    }
    proyecto.assertPuedeBuscarColaboradores()
    if (!proyecto.poseeHabilidadNecesaria(personaColaboradora)) {
      throw new DomainRuleError(
        "La persona debe poseer al menos una habilidad requerida.",
      )
    }
    this.fechaInscripcion = new Date()
    this.personaColaboradora = personaColaboradora
    this.proyecto = proyecto
    this.perfilId = perfilId
    this.esAnonima = esAnonima
  }
}
