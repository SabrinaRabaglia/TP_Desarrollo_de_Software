export default class HitoController {
  constructor(hitoService) {
    this.hitoService = hitoService
  }

  create = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(await this.hitoService.create(req.params.id, req.body))
    } catch (error) {
      next(error)
    }
  }

  getByProyectoId = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(await this.hitoService.getByProyectoId(req.params.id))
    } catch (error) {
      next(error)
    }
  }

  update = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(await this.hitoService.update(req.params.id, req.body))
    } catch (error) {
      next(error)
    }
  }

  delete = async (req, res, next) => {
    try {
      await this.hitoService.delete(req.params.id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
