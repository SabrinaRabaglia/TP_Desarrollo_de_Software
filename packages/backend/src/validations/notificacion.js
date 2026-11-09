import { z } from "zod"
import { objectIdSchema } from "./objectId.js"

export const notificacionSchema = z
  .object({
    personaColaboradora: objectIdSchema,
    contenido: z.string().max(4096),
  })
  .strict()
