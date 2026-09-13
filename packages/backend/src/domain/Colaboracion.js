import { UnprocessableEntityError } from "../errors/AppError.js"

export default class Colaboracion {
  constructor(fechaInscripcion = new Date(), personaColaboradora, proyecto) {
    if (!personaColaboradora || !proyecto) {
      throw new UnprocessableEntityError(
        "La colaboración debe tener una persona colaboradora y un proyecto asociados",
      )
    }
    this.fechaInscripcion = fechaInscripcion
    this.personaColaboradora = personaColaboradora
    this.proyecto = proyecto
  }
}
