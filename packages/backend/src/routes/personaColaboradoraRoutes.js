import { Router } from "express"
import validateId from "../middlewares/validateId.js"
import { personaColaboradoraController } from "../dependencias.js"

const routes = Router()

routes.post("/personas-colaboradoras", personaColaboradoraController.create)
routes.get("/personas-colaboradoras", personaColaboradoraController.getAll)
routes.get(
  "/personas-colaboradoras/:id",
  validateId,
  personaColaboradoraController.getById,
)
routes.put(
  "/personas-colaboradoras/:id",
  validateId,
  personaColaboradoraController.update,
)
routes.delete(
  "/personas-colaboradoras/:id",
  validateId,
  personaColaboradoraController.delete,
)
export default routes
