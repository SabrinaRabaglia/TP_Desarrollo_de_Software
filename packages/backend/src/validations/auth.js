import { z } from "zod"
import { personaColaboradoraSchema } from "./personaColaboradora.js"

export const contrasenaSchema = z.string().min(8)

export const loginSchema = z
  .object({
    email: z.email(),
    contrasena: contrasenaSchema,
  })
  .strict()

export const registroPersonaSchema = z
  .object({
    email: z.email(),
    contrasena: contrasenaSchema,
    persona: personaColaboradoraSchema,
  })
  .strict()
