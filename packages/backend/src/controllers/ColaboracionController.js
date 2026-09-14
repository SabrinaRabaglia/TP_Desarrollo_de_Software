import { z } from "zod"
import { BadRequestError } from "../errors/AppError.js"

const colaboracionSchema = z
  .object({
    personaColaboradoraId: z.string().uuid(),
    proyectoId: z.string().uuid(),
  })
  .strict()

export default class ColaboracionController {
  constructor(colaboracionService) {
    this.colaboracionService = colaboracionService
  }

  create = (req, res) => {
    const resultado = colaboracionSchema.safeParse(req.body)
    if (resultado.error) {
      throw new BadRequestError("Datos inválidos", resultado.error.issues)
    }
    const colaboracion = this.colaboracionService.create(resultado.data)
    res.status(201).json(colaboracion)
  }

  getAll = (_req, res) => {
    res.status(200).json(this.colaboracionService.getAll())
  }
}
