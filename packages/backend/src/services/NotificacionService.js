import {
  EntityNotFound,
  InvalidReference,
} from "../errors/ApplicationErrors.js"

export default class NotificacionService {
  constructor(
    notificacionRepository,
    perfilService,
    personaColaboradoraService,
    notificador,
  ) {
    this.notificacionRepository = notificacionRepository
    this.perfilService = perfilService
    this.personaColaboradoraService = personaColaboradoraService
    this.notificador = notificador
  }

  buscarDestinataria = async (personaColaboradoraId) => {
    try {
      return await this.personaColaboradoraService.getById(
        personaColaboradoraId,
      )
    } catch (error) {
      if (error instanceof EntityNotFound) {
        throw new InvalidReference(error.message)
      }
      throw error
    }
  }

  create = async (proyectoId, perfilId, { personaColaboradora, contenido }) => {
    const { proyecto, perfil } = await this.perfilService.buscarEnProyecto(
      proyectoId,
      perfilId,
    )
    const destinataria = await this.buscarDestinataria(personaColaboradora)
    const notificacion = proyecto.contactar(perfil, destinataria, contenido)
    notificacion.registrarMediosExternos(
      await this.notificador.notificar(destinataria, contenido),
    )
    return await this.notificacionRepository.save(notificacion)
  }

  getAllByPersonaColaboradora = async (personaColaboradoraId) => {
    await this.personaColaboradoraService.getById(personaColaboradoraId)
    return await this.notificacionRepository.findByPersonaColaboradora(
      personaColaboradoraId,
    )
  }
}
