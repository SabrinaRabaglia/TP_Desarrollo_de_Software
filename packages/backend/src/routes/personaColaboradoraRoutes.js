import { Router } from "express"
import validateId from "../middlewares/validateId.js"

import PersonaColaboradoraRepository from "../repositories/PersonaColaboradoraRepository.js"
import HabilidadRepository from "../repositories/HabilidadRepository.js"
import ColaboracionRepository from "../repositories/ColaboracionRepository.js"
import PersonaColaboradoraService from "../services/PersonaColaboradoraService.js"
import PersonaColaboradoraController from "../controllers/PersonaColaboradoraController.js"
import HabilidadService from "../services/HabilidadService.js"

const routes = Router()

const habilidadRepository = new HabilidadRepository()
const habilidadService = new HabilidadService(habilidadRepository)
const personaColaboradoraRepository = new PersonaColaboradoraRepository()
const personaColaboradoraService = new PersonaColaboradoraService(
  personaColaboradoraRepository,
  habilidadService,
  new ColaboracionRepository(),
)
const personaColaboradoraController = new PersonaColaboradoraController(
  personaColaboradoraService,
)

routes.post("/personas-colaboradoras", personaColaboradoraController.create)
routes.get("/personas-colaboradoras", personaColaboradoraController.getAll)
routes.get("/personas-colaboradoras/:id", validateId, personaColaboradoraController.getById)
routes.put("/personas-colaboradoras/:id", validateId, personaColaboradoraController.update)
routes.delete(
  "/personas-colaboradoras/:id",
  validateId,
  personaColaboradoraController.delete,
)
export default routes
