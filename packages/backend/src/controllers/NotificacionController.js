import z from "zod"
import { objectIdSchema } from "../validations/objectId.js"
import { BadRequestError } from "../errors/AppError.js"

const notificacionSchema = z.object({
    contenido: z.string(),
    colectivo: objectIdSchema,
    personaColaboradora: objectIdSchema,
    perfil: objectIdSchema,
}).strict()

export default class NotificacionController{
    constructor(notificacionService) {
    this.notificacionService = notificacionService
  }

  create = async (req, res, next) => {
          try {
              const resultado = notificacionSchema.safeParse(req.body)
              if (resultado.error) {
                  throw new BadRequestError("Datos inválidos", resultado.error.issues)
              }
              const notificacion = await this.notificacionService.create(resultado.data)
              res.status(201).json(notificacion)
          } catch (error) {
              next(error)
          }
      }

    getAll = async (req, res, next) => {
        try {
            const perfiles = await this.notificacionService.getAll()
            res.status(200).json(perfiles)
        } catch (error) {
            next(error)
        }
    }
}