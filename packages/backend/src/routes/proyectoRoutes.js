import { Router } from "express"
import validateId from "../middlewares/validateId.js"

import ProyectoRepository from "../repositories/ProyectoRepository.js"
import ProyectoService from "../services/ProyectoService.js"
import ProyectoController from "../controllers/ProyectoController.js"
import ColectivoService from "../services/ColectivoService.js"
import ColectivoRepository from "../repositories/ColectivoRepository.js"
import TipoColectivoRepository from "../repositories/TipoColectivoRepository.js"
import ProvinciaRepository from "../repositories/ProvinciaRepository.js"
import PaisRepository from "../repositories/PaisRepository.js"
import HabilidadService from "../services/HabilidadService.js"
import HabilidadRepository from "../repositories/HabilidadRepository.js"
import ColaboracionRepository from "../repositories/ColaboracionRepository.js"
import PerfilService from "../services/PerfilService.js"
import PerfilController from "../controllers/PerfilController.js"
import PersonaColaboradoraService from "../services/PersonaColaboradoraService.js"
import PersonaColaboradoraRepository from "../repositories/PersonaColaboradoraRepository.js"

const routes = Router()

const proyectoRepository = new ProyectoRepository()
const colectivoRepository = new ColectivoRepository()
const tipoColectivoRepository = new TipoColectivoRepository()
const provinciaRepository = new ProvinciaRepository()
const paisRepository = new PaisRepository()
const habilidadRepository = new HabilidadRepository()

const habilidadService = new HabilidadService(habilidadRepository)
const colectivoService = new ColectivoService(
  colectivoRepository,
  tipoColectivoRepository,
  proyectoRepository,
  provinciaRepository,
  paisRepository,
)

const colaboracionRepository = new ColaboracionRepository()
const proyectoService = new ProyectoService(
  proyectoRepository,
  colectivoService,
  colaboracionRepository,
)
const proyectoController = new ProyectoController(proyectoService)

const personaColaboradoraService = new PersonaColaboradoraService(
  new PersonaColaboradoraRepository(),
  habilidadService,
  colaboracionRepository,
)
const perfilService = new PerfilService(
  proyectoService,
  proyectoRepository,
  habilidadService,
  personaColaboradoraService,
)
const perfilController = new PerfilController(perfilService)

routes.post("/proyectos", proyectoController.create)
routes.get("/proyectos", proyectoController.getAll)
routes.get("/proyectos/:id", validateId, proyectoController.getById)
routes.put("/proyectos/:id", validateId, proyectoController.put)
routes.delete("/proyectos/:id", validateId, proyectoController.delete)
routes.patch("/proyectos/:id", validateId, proyectoController.patch)

routes.post("/proyectos/:id/perfiles", validateId, perfilController.create)
routes.get(
  "/proyectos/:id/perfiles",
  validateId,
  perfilController.getAllByProyecto,
)
routes.get(
  "/proyectos/:id/perfiles/:perfilId",
  validateId,
  perfilController.getById,
)
routes.put(
  "/proyectos/:id/perfiles/:perfilId",
  validateId,
  perfilController.update,
)
routes.delete(
  "/proyectos/:id/perfiles/:perfilId",
  validateId,
  perfilController.delete,
)
routes.get(
  "/proyectos/:id/perfiles/:perfilId/colaboradores",
  validateId,
  perfilController.buscarColaboradores,
)
export default routes
