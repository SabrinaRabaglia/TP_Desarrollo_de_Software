import { z } from "zod"
import { ModalidadColaboracion } from "../domain/enums/ModalidadColaboracion.js"
import { UnidadCompromiso } from "../domain/enums/UnidadCompromiso.js"
import { objectIdSchema } from "./objectId.js"

// Acepta "2026-12-31" o una fecha con hora; el dominio decide si es futura.
const fechaSchema = z
  .union([z.iso.date(), z.iso.datetime({ offset: true })])
  .transform((fecha) => new Date(fecha))

export const OrdenDeBusqueda = Object.freeze({
  RECIENTES: "recientes",
  ANTIGUOS: "antiguos",
})

// Filtros de la búsqueda de perfiles con búsqueda abierta. Las habilidades son
// obligatorias: contra ellas se calcula la coincidencia.
export const busquedaDePerfilesSchema = z.object({
  habilidades: z
    .union([objectIdSchema, z.array(objectIdSchema).min(1)])
    .transform((habilidades) => [habilidades].flat()),
  modalidad: z.enum(ModalidadColaboracion).optional(),
  orden: z.enum(OrdenDeBusqueda).default(OrdenDeBusqueda.RECIENTES),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

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
