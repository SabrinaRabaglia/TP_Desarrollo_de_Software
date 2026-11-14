import { Router } from "express"
import validar from "../middlewares/validar.js"
import {
  busquedaPersonasSchema,
  personaColaboradoraSchema,
} from "../validations/personaColaboradora.js"
import validateId, { validateIdParam } from "../middlewares/validateId.js"
import { autenticar, autorizarEntidad } from "../middlewares/autenticar.js"
import { RolUsuario } from "../domain/enums/RolUsuario.js"
import { personaColaboradoraController } from "../dependencias.js"

const routes = Router()

routes.post(
  "/personas-colaboradoras",
  validar(personaColaboradoraSchema),
  personaColaboradoraController.create,
)
routes.get(
  "/personas-colaboradoras",
  validar(busquedaPersonasSchema, "query"),
  personaColaboradoraController.getAll,
)

routes.get(
  "/personas-colaboradoras/:id",
  validateId,
  personaColaboradoraController.getById,
)
routes.put(
  "/personas-colaboradoras/:id",
  autenticar,
  validateId,
  autorizarEntidad(RolUsuario.PERSONA_COLABORADORA),
  validar(personaColaboradoraSchema),
  personaColaboradoraController.update,
)
routes.delete(
  "/personas-colaboradoras/:id",
  autenticar,
  validateId,
  autorizarEntidad(RolUsuario.PERSONA_COLABORADORA),
  personaColaboradoraController.delete,
)
routes.get(
  "/personas-colaboradoras/:id/medios-de-contacto",
  autenticar,
  validateId,
  personaColaboradoraController.getMediosDeContacto,
)
routes.delete(
  "/personas-colaboradoras/:id/medios-de-contacto/:contactoId",
  autenticar,
  validateId,
  validateIdParam("contactoId"),
  autorizarEntidad(RolUsuario.PERSONA_COLABORADORA),
  personaColaboradoraController.deleteMedioDeContacto,
)
export default routes
