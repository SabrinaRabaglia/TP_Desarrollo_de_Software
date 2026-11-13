import { Router } from "express"
import validar from "../middlewares/validar.js"
import { notificacionSchema } from "../validations/notificacion.js"
import validateId from "../middlewares/validateId.js"
import {
  autenticar,
  autorizar,
  autorizarEntidad,
} from "../middlewares/autenticar.js"
import { RolUsuario } from "../domain/enums/RolUsuario.js"
import { notificacionController } from "../dependencias.js"

const routes = Router()

// se crean colgadas del perfil y se leen desde la persona, por eso quedan en dos lados
// lo mas puro seria un /notificaciones solo, con proyecto y perfil en el body
// y el get filtrando por ?personaColaboradora=:id
routes.post(
  "/proyectos/:id/perfiles/:perfilId/notificaciones",
  autenticar,
  validateId,
  autorizar(RolUsuario.COLECTIVO),
  validar(notificacionSchema),
  notificacionController.create,
)
routes.get(
  "/personas-colaboradoras/:id/notificaciones",
  autenticar,
  validateId,
  autorizarEntidad(RolUsuario.PERSONA_COLABORADORA),
  notificacionController.getAllByPersonaColaboradora,
)

export default routes
