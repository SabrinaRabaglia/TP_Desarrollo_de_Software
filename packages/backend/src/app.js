import express from "express"
import cors from "cors"
import routes from "./routes.js"
import { NotFoundError } from "./errors/AppError.js"
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

app.use("/health", routes)

app.get("/hello", (req, res) => {
  res.json({ message: "hello world" })
})

app.use((_req, _res, next) => {
  next(new NotFoundError("Ruta no encontrada"))
})

app.use(errorHandler)

export default app
