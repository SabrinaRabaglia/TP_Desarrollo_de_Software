import { Router } from "express"
import validateId from "../middlewares/validateId.js"

import NotificacionController from "../controllers/NotificacionController.js"
import NotificacionService from "../services/NotificacionService.js"
import NotificacionRepository from "../repositories/NotificacionRepository.js"
import NotificadorExterno from "../services/NotificadorExterno.js"
import PerfilService from "../services/PerfilService.js"
import ProyectoService from "../services/ProyectoService.js"
import ProyectoRepository from "../repositories/ProyectoRepository.js"
import ColectivoService from "../services/ColectivoService.js"
import ColectivoRepository from "../repositories/ColectivoRepository.js"
import TipoColectivoRepository from "../repositories/TipoColectivoRepository.js"
import ProvinciaRepository from "../repositories/ProvinciaRepository.js"
import PaisRepository from "../repositories/PaisRepository.js"
import HabilidadService from "../services/HabilidadService.js"
import HabilidadRepository from "../repositories/HabilidadRepository.js"
import ColaboracionRepository from "../repositories/ColaboracionRepository.js"
import PersonaColaboradoraService from "../services/PersonaColaboradoraService.js"
import PersonaColaboradoraRepository from "../repositories/PersonaColaboradoraRepository.js"

const routes = Router()

const proyectoRepository = new ProyectoRepository()
const colaboracionRepository = new ColaboracionRepository()
const personaColaboradoraRepository = new PersonaColaboradoraRepository()
const notificacionRepository = new NotificacionRepository()
const habilidadService = new HabilidadService(
  new HabilidadRepository(),
  personaColaboradoraRepository,
  proyectoRepository,
)
const colectivoService = new ColectivoService(
  new ColectivoRepository(),
  new TipoColectivoRepository(),
  proyectoRepository,
  new ProvinciaRepository(),
  new PaisRepository(),
)
const proyectoService = new ProyectoService(
  proyectoRepository,
  colectivoService,
  colaboracionRepository,
)
const personaColaboradoraService = new PersonaColaboradoraService(
  personaColaboradoraRepository,
  habilidadService,
  colaboracionRepository,
  notificacionRepository,
)
const perfilService = new PerfilService(
  proyectoService,
  proyectoRepository,
  habilidadService,
  personaColaboradoraService,
  colaboracionRepository,
)
const notificacionController = new NotificacionController(
  new NotificacionService(
    notificacionRepository,
    perfilService,
    personaColaboradoraService,
    new NotificadorExterno(),
  ),
)

// se crean colgadas del perfil y se leen desde la persona, por eso quedan en dos lados
// lo mas puro seria un /notificaciones solo, con proyecto y perfil en el body
// y el get filtrando por ?personaColaboradora=:id
routes.post(
  "/proyectos/:id/perfiles/:perfilId/notificaciones",
  validateId,
  notificacionController.create,
)
routes.get(
  "/personas-colaboradoras/:id/notificaciones",
  validateId,
  notificacionController.getAllByPersonaColaboradora,
)

export default routes
