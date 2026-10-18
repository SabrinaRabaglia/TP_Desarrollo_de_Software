import { z } from "zod"
import { BadRequestError } from "../errors/ApplicationErrors.js"
import { objectIdSchema } from "../validations/objectId.js"
import { notificacionDTO } from "../dtos/notificacionDTO.js"

const notificacionSchema = z
  .object({
    personaColaboradora: objectIdSchema,
    contenido: z.string(),
  })
  .strict()

export default class NotificacionController {
  constructor(notificacionService) {
    this.notificacionService = notificacionService
  }

  create = async (req, res, next) => {
    try {
      const resultado = notificacionSchema.safeParse(req.body)
      if (resultado.error) {
        throw new BadRequestError("Datos inválidos", resultado.error.issues)
      }
      const notificacion = await this.notificacionService.create(
        req.params.id,
        req.params.perfilId,
        resultado.data,
      )
      res.status(201).json(notificacionDTO(notificacion))
    } catch (error) {
      next(error)
    }
  }

  getAllByPersonaColaboradora = async (req, res, next) => {
    try {
      const notificaciones =
        await this.notificacionService.getAllByPersonaColaboradora(
          req.params.id,
        )
      res.status(200).json(notificaciones.map(notificacionDTO))
    } catch (error) {
      next(error)
    }
  }
}
