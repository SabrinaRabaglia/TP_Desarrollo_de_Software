import express from "express"
import cors from "cors"
import routes from "./routes/routes.js"
import colaboracionRoutes from "./routes/colaboracionRoutes.js"
import colectivoRoutes from "./routes/colectivoRoutes.js"
import habilidadRoutes from "./routes/habilidadRoutes.js"
import personaColaboradoraRoutes from "./routes/personaColaboradoraRoutes.js"
import proyectoRoutes from "./routes/proyectoRoutes.js"
import errorHandler from "./middlewares/errorHandler.js"

const app = express()

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
      : true,
  }),
)

app.use(express.json())
app.use(routes)
app.use(colaboracionRoutes)
app.use(colectivoRoutes)
app.use(habilidadRoutes)
app.use(personaColaboradoraRoutes)
app.use(proyectoRoutes)

app.use("/health", routes)

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
