export default class PostulacionController {
  constructor(postulacionService) {
    this.postulacionService = postulacionService
  }

  create = async (req, res, next) => {
    try {
      const datosPostulacion = {
        personaColaboradoraId: req.usuario.entidad,
        perfilId: req.params.perfilId,
        esAnonima: req.body.esAnonima,
      }

      const postulacion = await this.postulacionService.create(datosPostulacion)
      res.status(201).json(postulacion)
    } catch (error) {
      next(error)
    }
  }

  getAllByColaborador = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(
          await this.postulacionService.getAllByColaborador(
            req.usuario.entidad,
          ),
        )
    } catch (error) {
      next(error)
    }
  }

  getAllByPerfil = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(
          await this.postulacionService.getAllByPerfil(
            req.params.perfilId,
            req.usuario.entidad,
          ),
        )
    } catch (error) {
      next(error)
    }
  }

  getById = async (req, res, next) => {
    try {
      res.status(200).json(await this.postulacionService.getById(req.params.id))
    } catch (error) {
      next(error)
    }
  }

  aceptar = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(
          await this.postulacionService.aceptar(
            req.params.id,
            req.usuario.entidad,
          ),
        )
    } catch (error) {
      next(error)
    }
  }

  rechazar = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(
          await this.postulacionService.rechazar(
            req.params.id,
            req.usuario.entidad,
          ),
        )
    } catch (error) {
      next(error)
    }
  }
}
