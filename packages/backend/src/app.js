import express from "express"
import cors from "cors"
import { createRequire } from "node:module"
import swaggerUi from "swagger-ui-express"
import routes from "./routes/routes.js"
import catalogoRoutes from "./routes/catalogoRoutes.js"
import colaboracionRoutes from "./routes/colaboracionRoutes.js"
import colectivoRoutes from "./routes/colectivoRoutes.js"
import habilidadRoutes from "./routes/habilidadRoutes.js"
import personaColaboradoraRoutes from "./routes/personaColaboradoraRoutes.js"
import proyectoRoutes from "./routes/proyectoRoutes.js"
import notificacionRoutes from "./routes/notificacionesRoutes.js"
import errorHandler from "./middlewares/errorHandler.js"
import hitoRoutes from "./routes/hitoRoutes.js";

const require = createRequire(import.meta.url)
const swaggerSpec = require("./docs/swaggerSpec.json")

const app = express()

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
      : true,
  }),
)

app.use(express.json())
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.use(routes)
app.use(catalogoRoutes)
app.use(colaboracionRoutes)
app.use(colectivoRoutes)
app.use(habilidadRoutes)
app.use(personaColaboradoraRoutes)
app.use(proyectoRoutes)
app.use(notificacionRoutes)
app.use(hitoRoutes)

app.get("/hello", (req, res) => {
  res.json({ message: "hello world" })
})

app.use((_req, _res, next) => {
  const error = new Error("Ruta no encontrada")
  error.status = 404
  error.expose = true
  next(error)
})

app.use(errorHandler)

export default app
