import { Router } from "express"
import validar from "../middlewares/validar.js"
import { colectivoSchema } from "../validations/colectivo.js"
import validateId from "../middlewares/validateId.js"
import { colectivoController } from "../dependencias.js"
import { autenticar, autorizarEntidad } from "../middlewares/autenticar.js"
import { RolUsuario } from "../domain/enums/RolUsuario.js"

const routes = Router()

routes.post("/colectivos", validar(colectivoSchema), colectivoController.create)
routes.get("/colectivos", colectivoController.getAll)
routes.get("/colectivos/:id", validateId, colectivoController.getById)
routes.put(
  "/colectivos/:id",
  autenticar,
  validateId,
  autorizarEntidad(RolUsuario.COLECTIVO),
  validar(colectivoSchema),
  colectivoController.update,
)
routes.patch(
  "/colectivos/:id",
  autenticar,
  validateId,
  autorizarEntidad(RolUsuario.COLECTIVO),
  validar(colectivoSchema.partial()),
  colectivoController.patch,
)
routes.delete(
  "/colectivos/:id",
  autenticar,
  validateId,
  autorizarEntidad(RolUsuario.COLECTIVO),
  colectivoController.delete,
)

export default routes
