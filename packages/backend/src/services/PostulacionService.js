import Postulacion from "../domain/Postulacion.js"
import { AlreadyExists, InvalidReference, NoAutorizado } from "../errors/ApplicationErrors.js"

export default class PostulacionService {
  constructor(colectivoRepository, postulacionRepository, proyectoRepository, personaRepository) {
    this.colectivoRepository = colectivoRepository
    this.postulacionRepository = postulacionRepository
    this.proyectoRepository = proyectoRepository
    this.personaRepository = personaRepository
  }

  create = async ({ perfilId, personaColaboradoraId, esAnonima }) => {
    const { proyecto, perfil } =
        await this.proyectoRepository.findProyectoYPerfilPorId(perfilId)
    
    if (!proyecto || !perfil) {
        throw new InvalidReference("Perfil no encontrado")
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

  getAllByColaborador = async (colaboradorId) => {
    const persona = await this.personaRepository.findById(colaboradorId)
    if(!persona){
      throw new InvalidReference("Persona no encontrada")
    }
    const postulaciones = await this.postulacionRepository.findAllByColaborador(colaboradorId)
    return await Promise.all(
    postulaciones.map(async (postulacion) => {
      const { proyecto, perfil } =
        await this.proyectoRepository.findProyectoYPerfilPorId(
          postulacion.perfilId,
        )

      return {
        ...postulacion.toObject(),
        proyecto: proyecto
          ? { titulo: proyecto.titulo }
          : null,
        perfil: perfil
          ? { nombre: perfil.nombre }
          : null,
      }
    }),
  )
  }

  getAllByPerfil = async (perfilId, colectivoId) => {
    const { proyecto, perfil } =
        await this.proyectoRepository.findProyectoYPerfilPorId(perfilId)
    if (!proyecto || !perfil) {
        throw new InvalidReference("Perfil no encontrado")
    }
    const colectivo = await this.colectivoRepository.findById(colectivoId)
    if (!colectivo) {
      throw new InvalidReference("Colectivo no encontrado")
    }
    if(proyecto.colectivo != colectivoId){
      throw new NoAutorizado("El proyecto no pertenece al colectivo autenticado")
    }
    return await this.postulacionRepository.findAllByPerfil(perfilId)
  }

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