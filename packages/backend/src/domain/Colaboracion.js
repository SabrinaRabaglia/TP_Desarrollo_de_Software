import { UnprocessableEntityError } from "../errors/AppError.js"

export default class Colaboracion {
  constructor(personaColaboradora, proyecto) {
    if (!personaColaboradora || !proyecto) {
      throw new UnprocessableEntityError(
        "La colaboración debe tener una persona colaboradora y un proyecto asociados",
      )
    }
    this.fechaInscripcion = new Date()
    this.personaColaboradora = personaColaboradora
    this.proyecto = proyecto
  }
}
