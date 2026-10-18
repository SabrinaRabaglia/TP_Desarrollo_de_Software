import { colectivoDTO } from "../dtos/colectivoDTO.js"

export default class ColectivoController {
  constructor(colectivoService) {
    this.colectivoService = colectivoService
  }

  getAll = async (req, res, next) => {
    try {
      res
        .status(200)
        .json((await this.colectivoService.getAll()).map(colectivoDTO))
    } catch (error) {
      next(error)
    }
  }
  getById = async (req, res, next) => {
    const { id } = req.params
    try {
      res
        .status(200)
        .json(colectivoDTO(await this.colectivoService.getById(id)))
    } catch (error) {
      next(error)
    }
  }
  create = async (req, res, next) => {
    try {
      const creado = await this.colectivoService.create(req.body)
      res.status(201).json(colectivoDTO(creado))
    } catch (error) {
      next(error)
    }
  }
  update = async (req, res, next) => {
    try {
      const id = req.params.id
      const actualizado = await this.colectivoService.update(id, req.body)
      res.status(200).json(colectivoDTO(actualizado))
    } catch (error) {
      next(error)
    }
  }
  patch = async (req, res, next) => {
    try {
      const { id } = req.params
      const colectivoActualizado = await this.colectivoService.patch(
        id,
        req.body,
      )
      res.status(200).json(colectivoDTO(colectivoActualizado))
    } catch (error) {
      next(error)
    }
  }

  delete = async (req, res, next) => {
    try {
      const { id } = req.params
      await this.colectivoService.delete(id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
