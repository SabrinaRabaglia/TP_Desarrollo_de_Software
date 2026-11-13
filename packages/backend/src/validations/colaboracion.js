import { z } from "zod"
import { objectIdSchema } from "./objectId.js"

export const colaboracionSchema = z
  .object({
    personaColaboradoraId: objectIdSchema,
    proyectoId: objectIdSchema,
    perfilId: objectIdSchema.optional(),
    esAnonima: z.boolean().optional(),
  })
  .strict()
