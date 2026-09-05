import { Router } from "express"
import { getHealth } from "./controllers/HealthController.js"

import { HabilidadRepository } from "./repositories/HabilidadRepository.js"
import { HabilidadService } from "./services/HabilidadService.js"
import { HabilidadController } from "./controllers/HabilidadController.js"
 
import { PersonaColaboradoraRepository } from "./repositories/PersonaColaboradoraRepository.js"
import { PersonaColaboradoraService } from "./services/PersonaColaboradoraService.js"
import { PersonaColaboradoraController } from "./controllers/PersonaColaboradoraController.js"

const routes = Router()

routes.get("/health", getHealth)

const habilidadRepository = new HabilidadRepository()
const habilidadService = new HabilidadService(habilidadRepository)
const habilidadController = new HabilidadController(habilidadService)
 
routes.post("/habilidades", habilidadController.create)
routes.get("/habilidades", habilidadController.getAll)
 
const personaColaboradoraRepository = new PersonaColaboradoraRepository()
const personaColaboradoraService = new PersonaColaboradoraService(personaColaboradoraRepository, habilidadRepository)
const personaColaboradoraController = new PersonaColaboradoraController(personaColaboradoraService)
 
routes.post("/personas-colaboradoras", personaColaboradoraController.create)
routes.get("/personas-colaboradoras", personaColaboradoraController.getAll)

export default routes
