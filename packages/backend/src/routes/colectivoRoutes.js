import { Router } from "express"
import validateId from "../middlewares/validateId.js"
import { colectivoController } from "../dependencias.js"

const routes = Router()

routes.post("/colectivos", colectivoController.create)
routes.get("/colectivos", colectivoController.getAll)
routes.get("/colectivos/:id", validateId, colectivoController.getById)
routes.put("/colectivos/:id", validateId, colectivoController.put)
routes.patch("/colectivos/:id", validateId, colectivoController.patch)
routes.delete("/colectivos/:id", validateId, colectivoController.delete)

export default routes
