import { Router } from "express"
import validar from "../middlewares/validar.js"
import { perfilSchema } from "../validations/perfil.js"
import {
  busquedaProyectosSchema,
  proyectoSchema,
} from "../validations/proyecto.js"
import { hitoSchema } from "../validations/hito.js"
import validateId from "../middlewares/validateId.js"
import { perfilController, proyectoController, hitoController } from "../dependencias.js"

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

routes.post(
  "/proyectos/:id/perfiles",
  validateId,
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
  validateId,
  validar(perfilSchema),
  perfilController.update,
)
routes.delete(
  "/proyectos/:id/perfiles/:perfilId",
  validateId,
  perfilController.delete,
)

routes.post(
  "/proyectos/:id/hitos",
  validateId,
  validar(hitoSchema),
  hitoController.create,
)
routes.get("/proyectos/:id/hitos", validateId, hitoController.getByProyectoId)


export default routes
