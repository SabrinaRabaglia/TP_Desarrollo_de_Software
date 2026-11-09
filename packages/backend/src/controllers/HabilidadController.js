export default class HabilidadController {
  constructor(habilidadService) {
    this.habilidadService = habilidadService
  }

  create = async (req, res, next) => {
    try {
      res.status(201).json(await this.habilidadService.create(req.body))
    } catch (error) {
      next(error)
    }
  }

  update = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(await this.habilidadService.update(req.params.id, req.body))
    } catch (error) {
      next(error)
    }
  }

  delete = async (req, res, next) => {
    try {
      await this.habilidadService.delete(req.params.id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  getById = async (req, res, next) => {
    try {
      res.status(200).json(await this.habilidadService.getById(req.params.id))
    } catch (error) {
      next(error)
    }
  }

  getAll = async (req, res, next) => {
    try {
      res.status(200).json(await this.habilidadService.getAll())
    } catch (error) {
      next(error)
    }
  }
}
