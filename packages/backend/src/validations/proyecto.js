import { z } from "zod"
import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js"
import { objectIdSchema } from "./objectId.js"

// Los enlaces se muestran como links: solo web, nunca "javascript:". Con null
// se quita un enlace ya cargado.
const enlaceSchema = z
  .url({ protocol: /^https?$/ })
  .nullable()
  .optional()

export const proyectoSchema = z
  .object({
    titulo: z.string(),
    descripcion: z.string(),
    colectivo: objectIdSchema,
    estado: z.enum(EstadoProyecto),
    fechaCierre: z.coerce.date().nullable(),
    enlaceSistemaEnFuncionamiento: enlaceSchema,
    enlaceCodigoFuente: enlaceSchema,
  })
  .strict()

export const busquedaProyectosSchema = z.object({
  habilidades: z
    .union([objectIdSchema, z.array(objectIdSchema)])
    .transform((habilidades) => [habilidades].flat())
    .optional(),

  q: z.string().trim().optional(),
  busquedaAbierta: z.coerce.boolean().optional(),

  //para la paginación pongo valores por defecto.
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})
