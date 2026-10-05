import { Router } from "express"

import PaisRepository from "../repositories/PaisRepository.js"
import ProvinciaRepository from "../repositories/ProvinciaRepository.js"
import CatalogoService from "../services/CatalogoService.js"
import CatalogoController from "../controllers/CatalogoController.js"

const routes = Router()

const catalogoService = new CatalogoService(
  new PaisRepository(),
  new ProvinciaRepository(),
)
const catalogoController = new CatalogoController(catalogoService)

routes.get("/paises", catalogoController.getPaises)
routes.get("/provincias", catalogoController.getProvincias)

export default routes
