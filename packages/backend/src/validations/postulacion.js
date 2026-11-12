import { z } from "zod"

export const postulacionSchema = z
  .object({
    esAnonima: z.boolean().optional(),
  })
  .strict()
