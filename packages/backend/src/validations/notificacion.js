import { z } from "zod"
import { objectIdSchema } from "./objectId.js"

export const notificacionSchema = z
  .object({
    personaColaboradora: objectIdSchema,
    contenido: z.string().max(4096),
  })
  .strict()

// Por ahora solo se puede marcar como leída; desmarcar no está previsto.
export const lecturaDeNotificacionesSchema = z
  .object({ leida: z.literal(true) })
  .strict()
