import { Router } from "express"
import validateId from "../middlewares/validateId.js"

import ProyectoRepository from "../repositories/ProyectoRepository.js"
import ProyectoService from "../services/ProyectoService.js"
import ProyectoController from "../controllers/ProyectoController.js"
import ColectivoRepository from "../repositories/ColectivoRepository.js"
import HabilidadService from "../services/HabilidadService.js"
import HabilidadRepository from "../repositories/HabilidadRepository.js"
import ColaboracionRepository from "../repositories/ColaboracionRepository.js"
import NotificacionRepository from "../repositories/NotificacionRepository.js"
import PerfilService from "../services/PerfilService.js"
import PerfilController from "../controllers/PerfilController.js"
import PersonaColaboradoraService from "../services/PersonaColaboradoraService.js"
import PersonaColaboradoraRepository from "../repositories/PersonaColaboradoraRepository.js"

const routes = Router()

const proyectoRepository = new ProyectoRepository()
const colectivoRepository = new ColectivoRepository()
const habilidadRepository = new HabilidadRepository()

const personaColaboradoraRepository = new PersonaColaboradoraRepository()
const habilidadService = new HabilidadService(
  habilidadRepository,
  personaColaboradoraRepository,
  proyectoRepository,
)

const colaboracionRepository = new ColaboracionRepository()
const proyectoService = new ProyectoService(
  proyectoRepository,
  colectivoRepository,
  colaboracionRepository,
)
const proyectoController = new ProyectoController(proyectoService)

const personaColaboradoraService = new PersonaColaboradoraService(
  personaColaboradoraRepository,
  habilidadService,
  colaboracionRepository,
  new NotificacionRepository(),
)
const perfilService = new PerfilService(
  proyectoService,
  proyectoRepository,
  habilidadService,
  personaColaboradoraService,
  colaboracionRepository,
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
// esto en realidad es una busqueda, la dejamos como subrecurso del perfil
// lo mas puro seria GET /personas-colaboradoras?proyecto=:id&perfil=:perfilId
routes.get(
  "/proyectos/:id/perfiles/:perfilId/colaboradores",
  validateId,
  perfilController.buscarColaboradores,
)
export default routes
