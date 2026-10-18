import { Router } from "express"
import validar from "../middlewares/validar.js"
import { colaboracionSchema } from "../validations/colaboracion.js"
import { colaboracionController } from "../dependencias.js"

const routes = Router()

routes.post(
  "/colaboraciones",
  validar(colaboracionSchema),
  colaboracionController.create,
)
routes.get("/colaboraciones", colaboracionController.getAll)

export default routes
