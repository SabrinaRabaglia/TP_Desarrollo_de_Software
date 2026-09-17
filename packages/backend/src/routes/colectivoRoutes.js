import { Router } from "express"

import ColectivoRepository from "../repositories/ColectivoRepository.js"
import TipoColectivoRepository from "../repositories/TipoColectivoRepository.js"
import ColectivoService from "../services/ColectivoService.js"
import ColectivoController from "../controllers/ColectivoController.js"
import ProyectoRepository from "../repositories/ProyectoRepository.js"

import ProvinciaRepository from "../repositories/ProvinciaRepository.js"
import PaisRepository from "../repositories/PaisRepository.js"

const routes = Router()
const provinciaRepository = new ProvinciaRepository()
const paisRepository = new PaisRepository()
const colectivoRepository = new ColectivoRepository()
const tipoColectivoRepository = new TipoColectivoRepository()
const proyectoRepository = new ProyectoRepository()
const colectivoService = new ColectivoService(
  colectivoRepository,
  tipoColectivoRepository,
  proyectoRepository,
  provinciaRepository,
  paisRepository
)
const colectivoController = new ColectivoController(colectivoService)

routes.post("/colectivos", colectivoController.create)
routes.get("/colectivos", colectivoController.getAll)
routes.get("/colectivos/:id", colectivoController.getById)
routes.put("/colectivos/:id", colectivoController.put)
routes.patch("/colectivos/:id", colectivoController.patch)
routes.delete("/colectivos/:id", colectivoController.delete)

export default routes
