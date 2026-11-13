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
    proyectoRepository,
    colectivoRepository,
  ) {
    this.notificacionRepository = notificacionRepository
    this.perfilService = perfilService
    this.personaColaboradoraService = personaColaboradoraService
    this.envioDeNotificaciones = envioDeNotificaciones
    this.proyectoRepository = proyectoRepository
    this.colectivoRepository = colectivoRepository
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

  // La notificación guarda solo ids; para mostrarla se completan los nombres.
  // Si el colectivo, el proyecto o el perfil ya no existen, quedan en null.
  conNombres = async (notificacion) => {
    const [colectivo, { proyecto, perfil }] = await Promise.all([
      this.colectivoRepository.findById(notificacion.colectivo),
      this.proyectoRepository.findProyectoYPerfilPorId(notificacion.perfil),
    ])
    return {
      id: notificacion.id,
      fecha: notificacion.fecha,
      contenido: notificacion.contenido,
      colectivo: colectivo
        ? { id: colectivo.id, nombre: colectivo.nombre }
        : null,
      proyecto: proyecto ? { id: proyecto.id, titulo: proyecto.titulo } : null,
      perfil: perfil ? { id: perfil.id, nombre: perfil.nombre } : null,
      pendienteDeEnvio: notificacion.pendienteDeEnvio,
      mediosExternosUtilizados: notificacion.mediosExternosUtilizados,
    }
  }

  getAllByPersonaColaboradora = async (personaColaboradoraId) => {
    await this.personaColaboradoraService.getById(personaColaboradoraId)
    const notificaciones =
      await this.notificacionRepository.findByPersonaColaboradora(
        personaColaboradoraId,
      )
    return await Promise.all(notificaciones.map(this.conNombres))
  }
}
