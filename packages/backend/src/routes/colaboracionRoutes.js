import { Router } from "express"

import ColaboracionRepository from "../repositories/ColaboracionRepository.js"
import ColaboracionService from "../services/ColaboracionService.js"
import ColaboracionController from "../controllers/ColaboracionController.js"
import ProyectoRepository from "../repositories/ProyectoRepository.js"
import PersonaColaboradoraRepository from "../repositories/PersonaColaboradoraRepository.js"

const routes = Router()

const proyectoRepository = new ProyectoRepository()
const personaColaboradoraRepository = new PersonaColaboradoraRepository()

const colaboracionService = new ColaboracionService(
  new ColaboracionRepository(),
  proyectoRepository,
  personaColaboradoraRepository,
)
const colaboracionController = new ColaboracionController(colaboracionService)

routes.post("/colaboraciones", colaboracionController.create)
routes.get("/colaboraciones", colaboracionController.getAll)

export default routes
