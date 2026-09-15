import { Router } from "express"

import PersonaColaboradoraRepository from "../repositories/PersonaColaboradoraRepository.js"
import PersonaColaboradoraService from "../services/PersonaColaboradoraService.js"
import PersonaColaboradoraController from "../controllers/PersonaColaboradoraController.js"
import HabilidadService from "../services/HabilidadService.js"

const routes = Router()

const habilidadService = new HabilidadService()
const personaColaboradoraRepository = new PersonaColaboradoraRepository()
const personaColaboradoraService = new PersonaColaboradoraService(
  personaColaboradoraRepository,
  habilidadService,
)
const personaColaboradoraController = new PersonaColaboradoraController(
  personaColaboradoraService,
)

routes.post("/personas-colaboradoras", personaColaboradoraController.create)
routes.get("/personas-colaboradoras", personaColaboradoraController.getAll)
routes.get("/personas-colaboradoras/:id", personaColaboradoraController.getById)
routes.put("/personas-colaboradoras/:id", personaColaboradoraController.update)
routes.delete(
  "/personas-colaboradoras/:id",
  personaColaboradoraController.delete,
)