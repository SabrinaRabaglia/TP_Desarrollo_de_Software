export default class PerfilController {
  constructor(perfilService, proyectoService) {
    this.perfilService = perfilService
    this.proyectoService = proyectoService
  }

  assertEsDelColectivo = (req) =>
    this.proyectoService.getDelColectivo(req.params.id, req.usuario.entidad)

  create = async (req, res, next) => {
    try {
      await this.assertEsDelColectivo(req)
      res
        .status(201)
        .json(await this.perfilService.create(req.params.id, req.body))
    } catch (error) {
      next(error)
    }
  }

  update = async (req, res, next) => {
    try {
      await this.assertEsDelColectivo(req)
      res
        .status(200)
        .json(
          await this.perfilService.update(
            req.params.id,
            req.params.perfilId,
            req.body,
          ),
        )
    } catch (error) {
      next(error)
    }
  }

  modificar = async (req, res, next) => {
    try {
      await this.assertEsDelColectivo(req)
      res
        .status(200)
        .json(
          await this.perfilService.modificar(
            req.params.id,
            req.params.perfilId,
            req.body,
          ),
        )
    } catch (error) {
      next(error)
    }
  }

  delete = async (req, res, next) => {
    try {
      await this.assertEsDelColectivo(req)
      await this.perfilService.delete(req.params.id, req.params.perfilId)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  buscar = async (req, res, next) => {
    try {
      res.status(200).json(await this.perfilService.buscarAbiertos(req.query))
    } catch (error) {
      next(error)
    }
  }

  getById = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(
          await this.perfilService.getById(req.params.id, req.params.perfilId),
        )
    } catch (error) {
      next(error)
    }
  }

  getAllByProyecto = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(await this.perfilService.getAllByProyectoId(req.params.id))
    } catch (error) {
      next(error)
    }
  }
}
