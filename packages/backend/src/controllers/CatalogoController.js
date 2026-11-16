export default class CatalogoController {
  constructor(catalogoService) {
    this.catalogoService = catalogoService
  }

  getPaises = async (_req, res, next) => {
    try {
      res.status(200).json(await this.catalogoService.getPaises())
    } catch (error) {
      next(error)
    }
  }

  getProvincias = async (_req, res, next) => {
    try {
      res.status(200).json(await this.catalogoService.getProvincias())
    } catch (error) {
      next(error)
    }
  }

  getTiposDeColectivo = async (_req, res, next) => {
    try {
      res.status(200).json(await this.catalogoService.getTiposDeColectivo())
    } catch (error) {
      next(error)
    }
  }
}
