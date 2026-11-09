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
      res.status(200).json(proyectos)
    } catch (error) {
      next(error)
    }
  }

  getById = async (req, res, next) => {
    try {
      res.status(200).json(await this.proyectoService.getById(req.params.id))
    } catch (error) {
      next(error)
    }
  }

  create = async (req, res, next) => {
    try {
      res.status(201).json(await this.proyectoService.create(req.body))
    } catch (error) {
      next(error)
    }
  }

  update = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(await this.proyectoService.update(req.params.id, req.body))
    } catch (error) {
      next(error)
    }
  }

  patch = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(await this.proyectoService.update(req.params.id, req.body))
    } catch (error) {
      next(error)
    }
  }

  delete = async (req, res, next) => {
    try {
      await this.proyectoService.delete(req.params.id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
