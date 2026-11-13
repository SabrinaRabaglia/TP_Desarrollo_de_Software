import {
  EntityNotFound,
  InvalidReference,
  NoAutorizado,
} from "../errors/ApplicationErrors.js"

export default class NotificacionService {
  constructor(
    notificacionRepository,
    perfilService,
    personaColaboradoraService,
    envioDeNotificaciones,
  ) {
    this.notificacionRepository = notificacionRepository
    this.perfilService = perfilService
    this.personaColaboradoraService = personaColaboradoraService
    this.envioDeNotificaciones = envioDeNotificaciones
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

  create = async (
    colectivoId,
    proyectoId,
    perfilId,
    { personaColaboradora, contenido },
  ) => {
    const { proyecto, perfil } = await this.perfilService.buscarEnProyecto(
      proyectoId,
      perfilId,
    )
    if (String(proyecto.colectivo) !== colectivoId) {
      throw new NoAutorizado(
        "Solo el colectivo del proyecto puede contactar personas",
      )
    }
    const destinataria = await this.buscarDestinataria(personaColaboradora)
    const notificacion = await this.notificacionRepository.save(
      proyecto.contactar(perfil, destinataria, contenido),
    )
    this.envioDeNotificaciones.despertar()
    return notificacion
  }

  getAllByPersonaColaboradora = async (personaColaboradoraId) => {
    await this.personaColaboradoraService.getById(personaColaboradoraId)
    return await this.notificacionRepository.findByPersonaColaboradora(
      personaColaboradoraId,
    )
  }
}
