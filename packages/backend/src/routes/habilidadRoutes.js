import { Router } from "express"
import validar from "../middlewares/validar.js"
import { habilidadSchema } from "../validations/habilidad.js"
import validateId from "../middlewares/validateId.js"
import { habilidadController } from "../dependencias.js"

const routes = Router()

routes.post(
  "/habilidades",
  validar(habilidadSchema),
  habilidadController.create,
)
routes.get("/habilidades", habilidadController.getAll)
routes.get("/habilidades/:id", validateId, habilidadController.getById)
routes.put(
  "/habilidades/:id",
  validateId,
  validar(habilidadSchema),
  habilidadController.update,
)
routes.delete("/habilidades/:id", validateId, habilidadController.delete)
export default routes
