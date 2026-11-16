export default class NotificacionController {
  constructor(notificacionService) {
    this.notificacionService = notificacionService
  }

  create = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          await this.notificacionService.create(
            req.usuario.entidad,
            req.params.id,
            req.params.perfilId,
            req.body,
          ),
        )
    } catch (error) {
      next(error)
    }
  }

  getAllByPersonaColaboradora = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(
          await this.notificacionService.getAllByPersonaColaboradora(
            req.params.id,
          ),
        )
    } catch (error) {
      next(error)
    }
  }

  contarSinLeer = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(await this.notificacionService.contarSinLeer(req.params.id))
    } catch (error) {
      next(error)
    }
  }

  marcarComoLeidas = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(await this.notificacionService.marcarComoLeidas(req.params.id))
    } catch (error) {
      next(error)
    }
  }

  getAllByColectivo = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(await this.notificacionService.getAllByColectivo(req.params.id))
    } catch (error) {
      next(error)
    }
  }
}
