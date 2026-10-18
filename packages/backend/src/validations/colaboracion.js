import { z } from "zod"
import { objectIdSchema } from "./objectId.js"

export const colaboracionSchema = z
  .object({
    personaColaboradoraId: objectIdSchema,
    proyectoId: objectIdSchema,
    esAnonima: z.boolean().optional(),
  })
  .strict()
