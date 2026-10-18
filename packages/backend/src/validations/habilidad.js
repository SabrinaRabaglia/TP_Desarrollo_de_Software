import { z } from "zod"

export const habilidadSchema = z
  .object({
    titulo: z.string().min(1),
    codigo: z.string().min(1),
    descripcion: z.string().min(1),
  })
  .strict()
