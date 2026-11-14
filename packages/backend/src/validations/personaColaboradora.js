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

export const busquedaPersonasSchema = z.object({
  perfiles: z
    .union([objectIdSchema, z.array(objectIdSchema)])
    .transform((perfiles) => [perfiles].flat())
    .optional(),

    // para buscar directamente por habilidades sueltas
  habilidades: z
    .union([objectIdSchema, z.array(objectIdSchema)])
    .transform((habilidades) => [habilidades].flat())
    .optional(),

  q: z.string().trim().optional(),

  //para la paginación pongo valores por defecto.
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})
