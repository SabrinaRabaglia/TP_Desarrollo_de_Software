import { Router } from "express"
import { colaboracionController } from "../dependencias.js"

const routes = Router()

routes.post("/colaboraciones", colaboracionController.create)
routes.get("/colaboraciones", colaboracionController.getAll)

export default routes
