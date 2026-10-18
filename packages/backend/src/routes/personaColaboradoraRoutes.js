import { Router } from "express"
import validar from "../middlewares/validar.js"
import { personaColaboradoraSchema } from "../validations/personaColaboradora.js"
import validateId from "../middlewares/validateId.js"
import { personaColaboradoraController } from "../dependencias.js"

const routes = Router()

routes.post(
  "/personas-colaboradoras",
  validar(personaColaboradoraSchema),
  personaColaboradoraController.create,
)
routes.get("/personas-colaboradoras", personaColaboradoraController.getAll)
routes.get(
  "/personas-colaboradoras/:id",
  validateId,
  personaColaboradoraController.getById,
)
routes.put(
  "/personas-colaboradoras/:id",
  validateId,
  validar(personaColaboradoraSchema),
  personaColaboradoraController.update,
)
routes.delete(
  "/personas-colaboradoras/:id",
  validateId,
  personaColaboradoraController.delete,
)
export default routes
