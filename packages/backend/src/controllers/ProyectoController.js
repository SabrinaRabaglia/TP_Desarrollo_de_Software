import { proyectoDTO } from "../dtos/proyectoDTO.js"

export default class ProyectoController {
  constructor(proyectoService) {
    this.proyectoService = proyectoService
  }

  getAll = async (req, res, next) => {
    try {
      const { habilidades } = req.query
      const proyectos = habilidades
        ? await this.proyectoService.getAllByHabilidades(habilidades)
        : await this.proyectoService.getAll()
      res.status(200).json(proyectos.map(proyectoDTO))
    } catch (error) {
      next(error)
    }
  }

  getById = async (req, res, next) => {
    try {
      const { id } = req.params
      res.status(200).json(proyectoDTO(await this.proyectoService.getById(id)))
    } catch (error) {
      next(error)
    }
  }

  create = async (req, res, next) => {
    try {
      const creado = await this.proyectoService.create(req.body)
      res.status(201).json(proyectoDTO(creado))
    } catch (error) {
      next(error)
    }
  }

  update = async (req, res, next) => {
    try {
      const id = req.params.id
      const actualizado = await this.proyectoService.update(id, req.body)
      res.status(200).json(proyectoDTO(actualizado))
    } catch (error) {
      next(error)
    }
  }

  patch = async (req, res, next) => {
    try {
      const { id } = req.params
      const proyectoActualizado = await this.proyectoService.update(
        id,
        req.body,
      )
      res.status(200).json(proyectoDTO(proyectoActualizado))
    } catch (error) {
      next(error)
    }
  }

  delete = async (req, res, next) => {
    try {
      const { id } = req.params
      await this.proyectoService.delete(id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
