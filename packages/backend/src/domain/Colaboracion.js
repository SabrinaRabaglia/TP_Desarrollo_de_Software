import { DomainValidationError } from "./errors/DomainErrors.js"

export default class Colaboracion {
  constructor(personaColaboradora, proyecto) {
    if (!personaColaboradora || !proyecto) {
      throw new DomainValidationError(
        "La colaboración debe tener una persona colaboradora y un proyecto asociados",
      )
    }
    this.fechaInscripcion = new Date()
    this.personaColaboradora = personaColaboradora
    this.proyecto = proyecto
  }
}
