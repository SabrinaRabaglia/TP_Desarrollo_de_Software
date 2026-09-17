import Colaboracion from "../domain/Colaboracion.js"
import ColaboracionRepository from "../repositories/ColaboracionRepository.js"
import ProyectoRepository from "../repositories/ProyectoRepository.js"
import PersonaColaboradoraRepository from "../repositories/PersonaColaboradoraRepository.js"
import {
  BadRequestError,
  ConflictError,
  NotFoundError
} from "../errors/AppError.js"

export default class ColaboracionService {
  constructor(colaboracionRepository = new ColaboracionRepository()
    , proyectoRepository = new ProyectoRepository(), personaRepository = new PersonaColaboradoraRepository()) {
    this.colaboracionRepository = colaboracionRepository 
    this.proyectoRepository = proyectoRepository
    this.personaRepository = personaRepository
  }

  create = async ({ proyectoId, personaColaboradoraId }) => {
    const proyecto = await this.proyectoRepository.findById(proyectoId)
    if (!proyecto) {
      throw new NotFoundError("Proyecto no encontrado")
    }
    const persona = await this.personaRepository.findById(personaColaboradoraId)
    if (!persona) {
      throw new NotFoundError("Persona colaboradora no encontrada")
    }
    if (
      await this.colaboracionRepository.findByPersonaAndProyecto(
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
    return await this.colaboracionRepository.save(colaboracion)
  }

  getAll = async () => await this.colaboracionRepository.getAll()
}
