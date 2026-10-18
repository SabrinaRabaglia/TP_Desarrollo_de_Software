import { z } from "zod"
import { objectIdSchema } from "./objectId.js"

export const colectivoSchema = z
  .object({
    nombre: z.string(),
    descripcion: z.string().min(2).max(500),
    tipo: z.string(),
    pais: objectIdSchema.nullable().optional(),
    provincia: objectIdSchema.nullable().optional(),
    ciudad: z.string().nullable().optional(),
  })
  .strict()
