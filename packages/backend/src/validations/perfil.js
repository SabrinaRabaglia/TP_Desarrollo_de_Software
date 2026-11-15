import { z } from "zod"
import { ModalidadColaboracion } from "../domain/enums/ModalidadColaboracion.js"
import { UnidadCompromiso } from "../domain/enums/UnidadCompromiso.js"
import { objectIdSchema } from "./objectId.js"

// Acepta "2026-12-31" o una fecha con hora; el dominio decide si es futura.
const fechaSchema = z
  .union([z.iso.date(), z.iso.datetime({ offset: true })])
  .transform((fecha) => new Date(fecha))

export const perfilSchema = z
  .object({
    nombre: z.string().optional(),
    descripcion: z.string(),
    unidadCompromiso: z.enum(UnidadCompromiso),
    cantidadHoras: z.number(),
    modalidadesColaboracion: z.array(z.enum(ModalidadColaboracion)),
    habilidadesRequeridas: z.array(objectIdSchema),
    habilidadesOpcionales: z.array(objectIdSchema),
    limiteColaboraciones: z.number().nullable().optional(),
    busquedaAbierta: z.boolean().optional(),
    busquedaAbiertaHasta: fechaSchema.nullable().optional(),
  })
  .strict()
