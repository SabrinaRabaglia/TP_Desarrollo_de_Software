import Colaboracion from "../domain/Colaboracion.js"
import {
  BadRequestError,
  ConflictError,
  NotFoundError
} from "../errors/AppError.js"

export default class ColaboracionService {
  constructor(colaboracionRepository, proyectoRepository, personaRepository) {
    this.colaboracionRepository = colaboracionRepository
    this.proyectoRepository = proyectoRepository
    this.personaRepository = personaRepository
  }

  create = ({ proyectoId, personaColaboradoraId }) => {
    const proyecto = this.proyectoRepository.findById(proyectoId)
    if (!proyecto) {
      throw new NotFoundError("Proyecto no encontrado")
    }
    const persona = this.personaRepository.findById(personaColaboradoraId)
    if (!persona) {
      throw new NotFoundError("Persona colaboradora no encontrada")
    }
    if (
      this.colaboracionRepository.findByPersonaAndProyecto(
        personaColaboradoraId,
        proyectoId,
      )
    ) {
      throw new ConflictError("La persona ya colabora en este proyecto")
    }
    if (proyecto.proyectoCerrado()) {
      throw new ConflictError(
        "El proyecto no acepta nuevos colaboradores",
      )
    }
    if (!proyecto.poseeHabilidadNecesaria(persona)) {
      throw new BadRequestError(
        "La persona debe poseer al menos una habilidad requerida",
      )
    }

    const colaboracion = new Colaboracion(persona, proyecto)
    persona.agregarColaboracion(colaboracion)
    proyecto.agregarColaboracion(colaboracion)
    return this.colaboracionRepository.save(colaboracion)
  }

  getAll = () => this.colaboracionRepository.getAll()
}
