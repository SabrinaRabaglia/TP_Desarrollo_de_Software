import { z } from "zod"
import { BadRequestError } from "../errors/AppError.js"
import { objectIdSchema } from "../validations/objectId.js"

const colaboracionSchema = z
  .object({
    personaColaboradoraId: objectIdSchema,
    proyectoId: objectIdSchema,
    esAnonima: z.boolean().optional().default(false)
  })
  .strict()

export default class ColaboracionController {
  constructor(colaboracionService) {
    this.colaboracionService = colaboracionService
    
  }

  create  = async (req, res, next) => {
    try{
      const resultado = colaboracionSchema.safeParse(req.body)
    if (resultado.error) {
      throw new BadRequestError("Datos inválidos", resultado.error.issues)
    }
    const colaboracion = await this.colaboracionService.create(resultado.data)
    res.status(201).json(colaboracion)
    }
    catch (error) {
      next(error)
    }
  }

  getAll = async (_req, res, next) => {
    try {
      res.status(200).json(await this.colaboracionService.getAll())
    } catch (error) {
      next(error)
    }
  }
}
