import { Router } from "express"
import validateId from "../middlewares/validateId.js"
import { perfilController, proyectoController } from "../dependencias.js"

const routes = Router()

routes.post("/proyectos", proyectoController.create)
routes.get("/proyectos", proyectoController.getAll)
routes.get("/proyectos/:id", validateId, proyectoController.getById)
routes.put("/proyectos/:id", validateId, proyectoController.put)
routes.delete("/proyectos/:id", validateId, proyectoController.delete)
routes.patch("/proyectos/:id", validateId, proyectoController.patch)

routes.post("/proyectos/:id/perfiles", validateId, perfilController.create)
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
  perfilController.update,
)
routes.delete(
  "/proyectos/:id/perfiles/:perfilId",
  validateId,
  perfilController.delete,
)
// esto en realidad es una busqueda, la dejamos como subrecurso del perfil
// lo mas puro seria GET /personas-colaboradoras?proyecto=:id&perfil=:perfilId
routes.get(
  "/proyectos/:id/perfiles/:perfilId/colaboradores",
  validateId,
  perfilController.buscarColaboradores,
)
export default routes
