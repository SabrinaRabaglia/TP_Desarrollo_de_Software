import { z } from "zod"
import { TipoCuenta } from "../domain/enums/TipoCuenta.js"
import { TipoMedioContacto } from "../domain/enums/TipoMedioContacto.js"
import { objectIdSchema } from "./objectId.js"

const cuentaSchema = z
  .object({
    nombreUsuario: z.string(),
    tipo: z.enum(Object.values(TipoCuenta)),
  })
  .strict()

export const medioDeContactoSchema = z
  .object({
    id: objectIdSchema.optional(),
    tipo: z.enum(Object.values(TipoMedioContacto)),
    valor: z.string().min(1),
  })
  .strict()

export const personaColaboradoraSchema = z
  .object({
    nombreFantasia: z.string(),
    nombre: z.string().optional(),
    apellido: z.string().optional(),
    pronombres: z.array(z.string()).optional(),
    presentacion: z.string().optional(),
    cuentas: z.array(cuentaSchema).optional(),
    habilidades: z.array(objectIdSchema).optional(),
    aceptaMensajeriaInterna: z.boolean().optional(),
    mediosDeContacto: z.array(medioDeContactoSchema).optional(),
  })
  .strict()
