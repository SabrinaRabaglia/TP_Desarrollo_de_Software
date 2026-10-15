import { Router } from "express"
import NotificacionController from "../controllers/NotificacionController.js"
import NotificacionService from "../services/NotificacionService.js"
import NotificacionRepository from "../repositories/NotificacionRepository.js"
import PersonaColaboradoraRepository from "../repositories/PersonaColaboradoraRepository.js"
import ColectivoRepository from "../repositories/ColectivoRepository.js"
import ProyectoRepository from "../repositories/ProyectoRepository.js"
import Notificador from "../domain/Notificador.js"

const routes = Router()

const notificacionService = new NotificacionService(
    new NotificacionRepository(),
    new PersonaColaboradoraRepository(),
    new ColectivoRepository(),
    new ProyectoRepository(),
    new Notificador())
const notificacionController = new NotificacionController(notificacionService)

routes.post("/notificaciones", notificacionController.create)
routes.get("/notificaciones", notificacionController.getAll)

export default routes