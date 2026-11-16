import { Router } from "express"
import { catalogoController } from "../dependencias.js"

const routes = Router()

routes.get("/paises", catalogoController.getPaises)
routes.get("/provincias", catalogoController.getProvincias)
routes.get("/tipos-de-colectivo", catalogoController.getTiposDeColectivo)

export default routes
