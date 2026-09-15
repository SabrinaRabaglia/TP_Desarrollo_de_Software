import { Router } from "express"
import { getHealth } from "../controllers/HealthController.js"


const routes = Router()

routes.get("/health", getHealth)


export default routes
