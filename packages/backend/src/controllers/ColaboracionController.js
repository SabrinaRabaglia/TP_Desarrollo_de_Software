import { colaboracionDTO } from "../dtos/colaboracionDTO.js"

export default class ColaboracionController {
  constructor(colaboracionService) {
    this.colaboracionService = colaboracionService
  }

  create = async (req, res, next) => {
    try {
      const colaboracion = await this.colaboracionService.create(req.body)
      res.status(201).json(colaboracionDTO(colaboracion))
    } catch (error) {
      next(error)
    }
  }

  getAll = async (_req, res, next) => {
    try {
      const colaboraciones = await this.colaboracionService.getAll()
      res.status(200).json(colaboraciones.map(colaboracionDTO))
    } catch (error) {
      next(error)
    }
  }
}
