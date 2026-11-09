export default class ColaboracionController {
  constructor(colaboracionService) {
    this.colaboracionService = colaboracionService
  }

  create = async (req, res, next) => {
    try {
      res.status(201).json(await this.colaboracionService.create(req.body))
    } catch (error) {
      next(error)
    }
  }

  getAll = async (_req, res, next) => {
    try {
      res.status(200).json(await this.colaboracionService.getAll())
    } catch (error) {
      next(error)
    }
  }
}
