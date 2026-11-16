import { z } from "zod"
import { colectivoSchema } from "./colectivo.js"
import { personaColaboradoraSchema } from "./personaColaboradora.js"

export const contrasenaSchema = z.string().min(8)

const credenciales = { email: z.email(), contrasena: contrasenaSchema }

export const loginSchema = z.object(credenciales).strict()

export const registroPersonaSchema = z
  .object({ ...credenciales, persona: personaColaboradoraSchema })
  .strict()

export const registroColectivoSchema = z
  .object({ ...credenciales, colectivo: colectivoSchema })
  .strict()
