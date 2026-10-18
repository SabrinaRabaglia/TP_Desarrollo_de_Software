import { Router } from "express"
import validateId from "../middlewares/validateId.js"
import { habilidadController } from "../dependencias.js"

const routes = Router()

routes.post("/habilidades", habilidadController.create)
routes.get("/habilidades", habilidadController.getAll)
routes.get("/habilidades/:id", validateId, habilidadController.getById)
routes.put("/habilidades/:id", validateId, habilidadController.update)
routes.delete("/habilidades/:id", validateId, habilidadController.delete)
export default routes
