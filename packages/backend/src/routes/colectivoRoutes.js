import { Router } from "express"
import validar from "../middlewares/validar.js"
import { colectivoSchema } from "../validations/colectivo.js"
import validateId from "../middlewares/validateId.js"
import { colectivoController } from "../dependencias.js"

const routes = Router()

routes.post("/colectivos", validar(colectivoSchema), colectivoController.create)
routes.get("/colectivos", colectivoController.getAll)
routes.get("/colectivos/:id", validateId, colectivoController.getById)
routes.put(
  "/colectivos/:id",
  validateId,
  validar(colectivoSchema),
  colectivoController.update,
)
routes.patch(
  "/colectivos/:id",
  validateId,
  validar(colectivoSchema.partial()),
  colectivoController.patch,
)
routes.delete("/colectivos/:id", validateId, colectivoController.delete)

export default routes
