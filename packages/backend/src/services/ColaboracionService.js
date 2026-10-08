import Colaboracion from "../domain/Colaboracion.js"
import { AlreadyExists, InvalidReference } from "../errors/ApplicationErrors.js"

export default class ColaboracionService {
  constructor(colaboracionRepository, proyectoRepository, personaRepository) {
    this.colaboracionRepository = colaboracionRepository 
    this.proyectoRepository = proyectoRepository
    this.personaRepository = personaRepository
  }

  create = async ({ proyectoId, personaColaboradoraId, esAnonima }) => {
    const proyecto = await this.proyectoRepository.findById(proyectoId)
    if (!proyecto) {
      throw new InvalidReference("Proyecto no encontrado")
    }
    const persona = await this.personaRepository.findById(personaColaboradoraId)
    if (!persona) {
      throw new InvalidReference("Persona colaboradora no encontrada")
    }
    if (
      await this.colaboracionRepository.findByPersonaAndProyecto(
        personaColaboradoraId,
        proyectoId,
      )
    ) {
      throw new AlreadyExists("La persona ya colabora en este proyecto")
    }

    return await this.colaboracionRepository.save(
      new Colaboracion(persona, proyecto, esAnonima),
    )
  }

  getAll = async () => await this.colaboracionRepository.getAll()
}
