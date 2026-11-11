import Postulacion from "../domain/Postulacion.js"
import { AlreadyExists, EntityNotFound, InvalidReference } from "../errors/ApplicationErrors.js"

export default class PostulacionService {
  constructor(postulacionRepository, proyectoRepository, personaRepository) {
    this.postulacionRepository = postulacionRepository
    this.proyectoRepository = proyectoRepository
    this.personaRepository = personaRepository
  }

  create = async ({ perfilId, personaColaboradoraId, esAnonima }) => {
    const { proyecto, perfil } =
        await this.proyectoRepository.findProyectoYPerfilPorId(perfilId)
    
    if (!proyecto || !perfil) {
        throw new EntityNotFound("Perfil no encontrado")
    }
    const persona = await this.personaRepository.findById(personaColaboradoraId)
    if (!persona) {
      throw new InvalidReference("Persona colaboradora no encontrada")
    }
    if (
      await this.postulacionRepository.findByPersonaAndPerfil(
        personaColaboradoraId,
        perfilId,
      )
    ) {
      throw new AlreadyExists("La persona ya se postulo en este perfil")
    }

    return await this.postulacionRepository.save(
      new Postulacion(persona, perfil, esAnonima),
    )
  }

  getAll = async () => await this.postulacionRepository.findAll()

  getById = async (id) => {
    const postulacion = await this.postulacionRepository.findById(id)
    if (!postulacion) {
      throw new InvalidReference("Postulacion no encontrada")
    }
    return postulacion
  }

  aceptar = async (id) => {
    const postulacion = await this.postulacionRepository.findById(id)
    if (!postulacion) {
      throw new InvalidReference("Postulacion no encontrada")
    }
    postulacion.aceptar()
    return await this.postulacionRepository.save(postulacion)
  }

  rechazar = async (id) => {
    const postulacion = await this.postulacionRepository.findById(id)
    if (!postulacion) {
      throw new InvalidReference("Postulacion no encontrada")
    }
    postulacion.rechazar()
    return await this.postulacionRepository.save(postulacion)
  }
}