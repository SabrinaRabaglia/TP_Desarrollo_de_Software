import { Router } from "express"
import { getHealth } from "./controllers/HealthController.js"

import HabilidadRepository from "./repositories/HabilidadRepository.js"
import HabilidadService from "./services/HabilidadService.js"
import HabilidadController from "./controllers/HabilidadController.js"
 
import PersonaColaboradoraRepository from "./repositories/PersonaColaboradoraRepository.js"
import PersonaColaboradoraService from "./services/PersonaColaboradoraService.js"
import PersonaColaboradoraController from "./controllers/PersonaColaboradoraController.js"

import ColectivoRepository from "./repositories/ColectivoRepository.js";
import TipoColectivoRepository from "./repositories/TipoColectivoRepository.js";
import ColectivoService from "./services/ColectivoService.js";
import ColectivoController from "./controllers/ColectivoController.js";

import ProyectoRepository from "./repositories/ProyectoRepository.js";
import ProyectoService from "./services/ProyectoService.js";
import ProyectoController from "./controllers/ProyectoController.js";

const routes = Router()

routes.get("/health", getHealth)

const habilidadRepository = new HabilidadRepository()
const habilidadService = new HabilidadService(habilidadRepository)
const habilidadController = new HabilidadController(habilidadService)
 
routes.post("/habilidades", habilidadController.create)
routes.get("/habilidades", habilidadController.getAll)
routes.get("/habilidades/:id", habilidadController.getById)
routes.put("/habilidades/:id", habilidadController.update)
routes.delete("/habilidades/:id", habilidadController.delete)

const personaColaboradoraRepository = new PersonaColaboradoraRepository()
const personaColaboradoraService = new PersonaColaboradoraService(personaColaboradoraRepository, habilidadService)
const personaColaboradoraController = new PersonaColaboradoraController(personaColaboradoraService)
 
routes.post("/personas-colaboradoras", personaColaboradoraController.create)
routes.get("/personas-colaboradoras", personaColaboradoraController.getAll)
routes.get("/personas-colaboradoras/:id", personaColaboradoraController.getById)
routes.put("/personas-colaboradoras/:id", personaColaboradoraController.update)
routes.delete("/personas-colaboradoras/:id", personaColaboradoraController.delete)

const colectivoRepository = new ColectivoRepository()
const tipoColectivoRepository = new TipoColectivoRepository()
const proyectoRepository = new ProyectoRepository()
const colectivoService = new ColectivoService(colectivoRepository, tipoColectivoRepository, proyectoRepository)
const colectivoController = new ColectivoController(colectivoService)

routes.post("/colectivos", colectivoController.create);
routes.get("/colectivos", colectivoController.getAll);
routes.get("/colectivos/:id", colectivoController.getById);
routes.put("/colectivos/:id", colectivoController.put);
routes.patch("/colectivos/:id", colectivoController.patch);
routes.delete("/colectivos/:id", colectivoController.delete);

const proyectoService = new ProyectoService(proyectoRepository, colectivoService, habilidadService)
const proyectoController = new ProyectoController(proyectoService)

routes.post("/proyectos", proyectoController.create);
routes.get("/proyectos", proyectoController.getAll);
routes.get("/proyectos/:id", proyectoController.getById);
routes.put("/proyectos/:id", proyectoController.put);
routes.delete("/proyectos/:id", proyectoController.delete);


export default routes
