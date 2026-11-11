export default class PostulacionController {
  constructor(postulacionService) {
    this.postulacionService = postulacionService
  }

  create = async (req, res, next) => {
    try {
      res.status(201).json(await this.postulacionService.create(req.body))
    } catch (error) {
      next(error)
    }
  }

  getAll = async (_req, res, next) => {
    try {
      res.status(200).json(await this.postulacionService.getAll())
    } catch (error) {
      next(error)
    }
  }

  getById = async (req, res, next) => {
    try {
      res.status(200).json(await this.postulacionService.getById(req.params.id))
    } catch (error) {
      next(error)
    }
  }

  aceptar = async (req, res, next) => {
    try {
      res.status(200).json(await this.postulacionService.aceptar(req.params.id, req.body))
    } catch (error) {
      next(error)
    }
  }

  rechazar = async (req, res, next) => {
    try {
      res.status(200).json(await this.postulacionService.rechazar(req.params.id))
    } catch (error) {
      next(error)
    }
  }
}
