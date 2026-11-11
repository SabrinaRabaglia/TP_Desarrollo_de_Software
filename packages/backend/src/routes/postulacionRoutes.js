import { Router } from "express"
import validar from "../middlewares/validar.js"
import validateId from "../middlewares/validateId.js"
import { postulacionSchema } from "../validations/postulacion.js"
import { postulacionController } from "../dependencias.js"

const routes = Router()

routes.post(
  "/postulaciones",
  validar(postulacionSchema),
  postulacionController.create,
)

routes.get("/postulaciones", postulacionController.getAll)

routes.get("/postulaciones/:id", validateId, postulacionController.getById)

routes.patch("/postulaciones/:id/aceptar",
  validateId,
  postulacionController.aceptar
)

routes.patch("/postulaciones/:id/rechazar",
  validateId,
  postulacionController.rechazar
)
export default routes
