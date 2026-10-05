import { Router } from "express"
import validateId from "../middlewares/validateId.js"

import HabilidadRepository from "../repositories/HabilidadRepository.js"
import HabilidadService from "../services/HabilidadService.js"
import HabilidadController from "../controllers/HabilidadController.js"

const routes = Router()

const habilidadRepository = new HabilidadRepository()
const habilidadService = new HabilidadService(habilidadRepository)
const habilidadController = new HabilidadController(habilidadService)

routes.post("/habilidades", habilidadController.create)
routes.get("/habilidades", habilidadController.getAll)
routes.get("/habilidades/:id", validateId, habilidadController.getById)
routes.put("/habilidades/:id", validateId, habilidadController.update)
routes.delete("/habilidades/:id", validateId, habilidadController.delete)
export default routes
