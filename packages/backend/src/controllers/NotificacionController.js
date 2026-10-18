import { notificacionDTO } from "../dtos/notificacionDTO.js"

export default class NotificacionController {
  constructor(notificacionService) {
    this.notificacionService = notificacionService
  }

  create = async (req, res, next) => {
    try {
      const notificacion = await this.notificacionService.create(
        req.params.id,
        req.params.perfilId,
        req.body,
      )
      res.status(201).json(notificacionDTO(notificacion))
    } catch (error) {
      next(error)
    }
  }

  getAllByPersonaColaboradora = async (req, res, next) => {
    try {
      const notificaciones =
        await this.notificacionService.getAllByPersonaColaboradora(
          req.params.id,
        )
      res.status(200).json(notificaciones.map(notificacionDTO))
    } catch (error) {
      next(error)
    }
  }
}
