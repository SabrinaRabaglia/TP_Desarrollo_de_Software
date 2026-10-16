import { Router } from "express"
import NotificacionController from "../controllers/NotificacionController.js"
import NotificacionService from "../services/NotificacionService.js"
import NotificacionRepository from "../repositories/NotificacionRepository.js"
import PersonaColaboradoraRepository from "../repositories/PersonaColaboradoraRepository.js"
import ColectivoRepository from "../repositories/ColectivoRepository.js"
import ProyectoRepository from "../repositories/ProyectoRepository.js"
import NotificadorExterno from "../services/NotificadorExterno.js"

const routes = Router()

const notificacionService = new NotificacionService(
    new NotificacionRepository(),
    new PersonaColaboradoraRepository(),
    new ColectivoRepository(),
    new ProyectoRepository(),
    new NotificadorExterno())
const notificacionController = new NotificacionController(notificacionService)

routes.post("/notificaciones", notificacionController.create)
routes.get("/notificaciones", notificacionController.getAll)

export default routes