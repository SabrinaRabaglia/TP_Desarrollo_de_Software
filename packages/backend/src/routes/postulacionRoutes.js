import { Router } from "express"
import validateId from "../middlewares/validateId.js"
import { postulacionController } from "../dependencias.js"
import { autenticar, autorizar } from "../middlewares/autenticar.js"
import { RolUsuario } from "../domain/enums/RolUsuario.js"

const routes = Router()

routes.get(
  "/postulaciones",
  autenticar,
  autorizar(RolUsuario.PERSONA_COLABORADORA),
  postulacionController.getAllByColaborador,
)

//routes.get("/postulaciones/:id", validateId, postulacionController.getById)

routes.patch(
  "/postulaciones/:id/aceptar",
  autenticar,
  validateId,
  autorizar(RolUsuario.COLECTIVO),
  postulacionController.aceptar,
)

routes.patch(
  "/postulaciones/:id/rechazar",
  autenticar,
  validateId,
  autorizar(RolUsuario.COLECTIVO),
  postulacionController.rechazar,
)

// La persona se da de baja y el colectivo desanota: el service decide quién puede.
routes.patch(
  "/postulaciones/:id/baja",
  autenticar,
  validateId,
  autorizar(RolUsuario.COLECTIVO, RolUsuario.PERSONA_COLABORADORA),
  postulacionController.darDeBaja,
)
export default routes
