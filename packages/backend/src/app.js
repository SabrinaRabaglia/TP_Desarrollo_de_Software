import express from "express"
import cors from "cors"
import healthRoutes from "./routes/healthRoutes.js"

const app = express()

app.use(express.json())
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
      : true,
  }),
)

app.use("/health", healthRoutes)

app.get("/hello", (req, res) => {
  res.json({ message: "hello world" })
})

export default app
