import { Router } from "express"
import validar from "../middlewares/validar.js"
import { autenticar } from "../middlewares/autenticar.js"
import {
  loginSchema,
  registroColectivoSchema,
  registroPersonaSchema,
} from "../validations/auth.js"
import { authController } from "../dependencias.js"

const routes = Router()

routes.post("/auth/login", validar(loginSchema), authController.login)
routes.post(
  "/auth/registro/persona-colaboradora",
  validar(registroPersonaSchema),
  authController.registrarPersonaColaboradora,
)
routes.post(
  "/auth/registro/colectivo",
  validar(registroColectivoSchema),
  authController.registrarColectivo,
)
routes.get("/auth/me", autenticar, authController.me)

export default routes
