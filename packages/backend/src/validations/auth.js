import { z } from "zod"

export const contrasenaSchema = z.string().min(8)

export const loginSchema = z
  .object({
    email: z.email(),
    contrasena: contrasenaSchema,
  })
  .strict()
