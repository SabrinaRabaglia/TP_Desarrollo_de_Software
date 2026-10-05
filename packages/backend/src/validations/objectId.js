import { z } from "zod"

export const OBJECT_ID = /^[0-9a-fA-F]{24}$/

export const objectIdSchema = z
  .string()
  .regex(OBJECT_ID, "Debe ser un id válido (24 caracteres hexadecimales)")
