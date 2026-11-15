import { z } from "zod"
import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js"
import { objectIdSchema } from "./objectId.js"

export const proyectoSchema = z
  .object({
    titulo: z.string(),
    descripcion: z.string(),
    colectivo: objectIdSchema,
    estado: z.enum(EstadoProyecto),
    fechaCierre: z.coerce.date().nullable(),
    enlaceSistemaEnFuncionamiento: z.string().url().optional(),
    enlaceCodigoFuente: z.string().url().optional(),
  })
  .strict()

export const busquedaProyectosSchema = z.object({
  habilidades: z
    .union([objectIdSchema, z.array(objectIdSchema)])
    .transform((habilidades) => [habilidades].flat())
    .optional(),

  q: z.string().trim().optional(),
  busquedaAbierta: z.coerce.boolean().optional(),
  estado: z.string().optional(),
  modalidad: z.string().optional(),
  orden: z.string().optional(),

  //para la paginación pongo valores por defecto.
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})
