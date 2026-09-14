import express from "express"
import cors from "cors"
import routes from "./routes.js"
import { NotFoundError } from "./errors/AppError.js"
import errorHandler from "./middlewares/errorHandler.js"
import Colaboracion from "./domain/Colaboracion.js"

const app = express()

// Evita recorrer los vínculos de vuelta a la persona y al proyecto en el JSON.
app.set("json replacer", (_key, value) => {
  if (value instanceof Colaboracion) {
    return {
      fechaInscripcion: value.fechaInscripcion,
      personaColaboradora: {
        id: value.personaColaboradora.id,
        nombreFantasia: value.personaColaboradora.nombreFantasia,
      },
      proyecto: { id: value.proyecto.id, titulo: value.proyecto.titulo },
    }
  }
  return value
})

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
      : true,
  }),
)

app.use(express.json())
app.use(routes)

app.use("/health", routes)

app.get("/hello", (req, res) => {
  res.json({ message: "hello world" })
})

app.use((_req, _res, next) => {
  next(new NotFoundError("Ruta no encontrada"))
})

app.use(errorHandler)

export default app
