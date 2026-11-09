export default class ColectivoController {
  constructor(colectivoService) {
    this.colectivoService = colectivoService
  }

  getAll = async (req, res, next) => {
    try {
      res.status(200).json(await this.colectivoService.getAll())
    } catch (error) {
      next(error)
    }
  }

  getById = async (req, res, next) => {
    try {
      res.status(200).json(await this.colectivoService.getById(req.params.id))
    } catch (error) {
      next(error)
    }
  }

  create = async (req, res, next) => {
    try {
      res.status(201).json(await this.colectivoService.create(req.body))
    } catch (error) {
      next(error)
    }
  }

  update = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(await this.colectivoService.update(req.params.id, req.body))
    } catch (error) {
      next(error)
    }
  }

  patch = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(await this.colectivoService.patch(req.params.id, req.body))
    } catch (error) {
      next(error)
    }
  }

  delete = async (req, res, next) => {
    try {
      await this.colectivoService.delete(req.params.id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
