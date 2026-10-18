import { catalogoDTO } from "../dtos/catalogoDTO.js"

export default class CatalogoController {
  constructor(catalogoService) {
    this.catalogoService = catalogoService
  }

  getPaises = async (_req, res, next) => {
    try {
      res
        .status(200)
        .json((await this.catalogoService.getPaises()).map(catalogoDTO))
    } catch (error) {
      next(error)
    }
  }

  getProvincias = async (_req, res, next) => {
    try {
      res
        .status(200)
        .json((await this.catalogoService.getProvincias()).map(catalogoDTO))
    } catch (error) {
      next(error)
    }
  }
}
