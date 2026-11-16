import { Router } from "express"
import validar from "../middlewares/validar.js"
import validateId from "../middlewares/validateId.js"
import { cambiosDeHitoSchema } from "../validations/hito.js"
import { hitoController } from "../dependencias.js"
import { autenticar, autorizar } from "../middlewares/autenticar.js"
import { RolUsuario } from "../domain/enums/RolUsuario.js"

const routes = Router()

routes.patch(
  "/hitos/:id",
  autenticar,
  validateId,
  autorizar(RolUsuario.COLECTIVO),
  validar(cambiosDeHitoSchema),
  hitoController.update,
)
routes.delete(
  "/hitos/:id",
  autenticar,
  validateId,
  autorizar(RolUsuario.COLECTIVO),
  hitoController.delete,
)

export default routes
