export default class ProyectoController {
  constructor(proyectoService) {
    this.proyectoService = proyectoService
  }

  assertEsDelColectivo = (req) =>
    this.proyectoService.getDelColectivo(req.params.id, req.usuario.entidad)

  getAll = async (req, res, next) => {
    try {
      const { habilidades, q, busquedaAbierta } = req.query

      if (habilidades && !q && busquedaAbierta === undefined) {
        const resultados =
          await this.proyectoService.getAllByHabilidades(habilidades)
        return res.status(200).json({
          metadata: {
            page: 1,
            limit: resultados.length || 0,
            total: resultados.length || 0,
          },
          data: resultados,
        })
      }

      const respuesta = await this.proyectoService.getAll(req.query)
      return res.status(200).json(respuesta)
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
      await this.assertEsDelColectivo(req)
      res
        .status(200)
        .json(await this.proyectoService.update(req.params.id, req.body))
    } catch (error) {
      next(error)
    }
  }

  patch = async (req, res, next) => {
    try {
      await this.assertEsDelColectivo(req)
      res
        .status(200)
        .json(await this.proyectoService.update(req.params.id, req.body))
    } catch (error) {
      next(error)
    }
  }

  delete = async (req, res, next) => {
    try {
      await this.assertEsDelColectivo(req)
      await this.proyectoService.delete(req.params.id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
