import { Router } from "express"
import validar from "../middlewares/validar.js"
import {
  busquedaDePerfilesSchema,
  perfilSchema,
} from "../validations/perfil.js"
import {
  busquedaProyectosSchema,
  proyectoSchema,
} from "../validations/proyecto.js"
import { postulacionSchema } from "../validations/postulacion.js"
import { hitoSchema } from "../validations/hito.js"
import validateId from "../middlewares/validateId.js"
import {
  perfilController,
  proyectoController,
  hitoController,
  postulacionController,
  personaColaboradoraController,
} from "../dependencias.js"
import { autenticar, autorizar } from "../middlewares/autenticar.js"
import { RolUsuario } from "../domain/enums/RolUsuario.js"

const routes = Router()

routes.post("/proyectos", validar(proyectoSchema), proyectoController.create)
routes.get(
  "/proyectos",
  validar(busquedaProyectosSchema, "query"),
  proyectoController.getAll,
)
routes.get("/proyectos/:id", validateId, proyectoController.getById)
routes.put(
  "/proyectos/:id",
  validateId,
  validar(proyectoSchema),
  proyectoController.update,
)
routes.delete("/proyectos/:id", validateId, proyectoController.delete)
routes.patch(
  "/proyectos/:id",
  validateId,
  validar(proyectoSchema.partial()),
  proyectoController.patch,
)

// Una persona colaboradora busca perfiles con búsqueda abierta según sus
// habilidades.
routes.get(
  "/perfiles",
  autenticar,
  autorizar(RolUsuario.PERSONA_COLABORADORA),
  validar(busquedaDePerfilesSchema, "query"),
  perfilController.buscar,
)

// Los perfiles los escribe solo el colectivo dueño del proyecto.
routes.post(
  "/proyectos/:id/perfiles",
  autenticar,
  validateId,
  autorizar(RolUsuario.COLECTIVO),
  validar(perfilSchema),
  perfilController.create,
)
routes.get(
  "/proyectos/:id/perfiles",
  validateId,
  perfilController.getAllByProyecto,
)
routes.get(
  "/proyectos/:id/perfiles/:perfilId",
  validateId,
  perfilController.getById,
)
routes.put(
  "/proyectos/:id/perfiles/:perfilId",
  autenticar,
  validateId,
  autorizar(RolUsuario.COLECTIVO),
  validar(perfilSchema),
  perfilController.update,
)
routes.patch(
  "/proyectos/:id/perfiles/:perfilId",
  autenticar,
  validateId,
  autorizar(RolUsuario.COLECTIVO),
  validar(perfilSchema.partial()),
  perfilController.modificar,
)
routes.delete(
  "/proyectos/:id/perfiles/:perfilId",
  autenticar,
  validateId,
  autorizar(RolUsuario.COLECTIVO),
  perfilController.delete,
)

routes.get(
  "/proyectos/:id/perfiles/:perfilId/postulaciones",
  autenticar,
  validateId,
  autorizar(RolUsuario.COLECTIVO),
  postulacionController.getAllByPerfil,
)

routes.get(
  "/proyectos/:id/perfiles/:perfilId/colaboradores",
  validateId,
  personaColaboradoraController.getAllByPostulacionAceptada,
)

routes.post(
  "/proyectos/:id/perfiles/:perfilId/postulaciones",
  autenticar,
  autorizar(RolUsuario.PERSONA_COLABORADORA),
  validar(postulacionSchema),
  postulacionController.create,
)

routes.post(
  "/proyectos/:id/hitos",
  validateId,
  validar(hitoSchema),
  hitoController.create,
)
routes.get("/proyectos/:id/hitos", validateId, hitoController.getByProyectoId)

export default routes
