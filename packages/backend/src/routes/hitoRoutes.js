import { Router } from "express"
import validar from "../middlewares/validar.js"
import validateId from "../middlewares/validateId.js"
import { cambiosDeHitoSchema } from "../validations/hito.js"
import { hitoController } from "../dependencias.js"

const routes = Router()

routes.patch(
  "/hitos/:id",
  validateId,
  validar(cambiosDeHitoSchema),
  hitoController.update,
)
routes.delete("/hitos/:id", validateId, hitoController.delete)

export default routes
