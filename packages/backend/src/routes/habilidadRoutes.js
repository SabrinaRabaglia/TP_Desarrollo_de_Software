import { Router } from "express"

import HabilidadRepository from "../repositories/HabilidadRepository.js"
import HabilidadService from "../services/HabilidadService.js"
import HabilidadController from "../controllers/HabilidadController.js"

const routes = Router()

const habilidadRepository = new HabilidadRepository()
const habilidadService = new HabilidadService(habilidadRepository)
const habilidadController = new HabilidadController(habilidadService)

routes.post("/habilidades", habilidadController.create)
routes.get("/habilidades", habilidadController.getAll)
routes.get("/habilidades/:id", habilidadController.getById)
routes.put("/habilidades/:id", habilidadController.update)
routes.delete("/habilidades/:id", habilidadController.delete)
export default routes
