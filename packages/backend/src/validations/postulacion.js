import { z } from "zod"
import { objectIdSchema } from "./objectId.js"

export const postulacionSchema = z
  .object({
    personaColaboradoraId: objectIdSchema,
    perfilId: objectIdSchema,
    esAnonima: z.boolean().optional(),
  })
  .strict()
