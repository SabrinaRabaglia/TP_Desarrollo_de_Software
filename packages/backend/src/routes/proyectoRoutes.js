import { Router } from "express"

import ProyectoRepository from "../repositories/ProyectoRepository.js"
import ProyectoService from "../services/ProyectoService.js"
import ProyectoController from "../controllers/ProyectoController.js"
import ColectivoService from "../services/ColectivoService.js"
import ColectivoRepository from "../repositories/ColectivoRepository.js"
import HabilidadService from "../services/HabilidadService.js"
import HabilidadRepository from "../repositories/HabilidadRepository.js"

const routes = Router()

const proyectoRepository = new ProyectoRepository()
const colectivoRepository = new ColectivoRepository()
const habilidadRepository = new HabilidadRepository()

const habilidadService = new HabilidadService(habilidadRepository)
const colectivoService = new ColectivoService(colectivoRepository)

const proyectoService = new ProyectoService(
  proyectoRepository,
  colectivoService,
  habilidadService,
)
const proyectoController = new ProyectoController(proyectoService)

routes.post("/proyectos", proyectoController.create)
routes.get("/proyectos", proyectoController.getAll)
routes.get("/proyectos/:id", proyectoController.getById)
routes.put("/proyectos/:id", proyectoController.put)
routes.delete("/proyectos/:id", proyectoController.delete)
routes.patch("/proyectos/:id", proyectoController.patch)
export default routes
