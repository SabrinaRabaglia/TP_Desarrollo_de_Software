import { z } from "zod"
import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js"
import { objectIdSchema } from "./objectId.js"

export const proyectoSchema = z
  .object({
    titulo: z.string(),
    descripcion: z.string(),
    colectivo: objectIdSchema,
    estado: z.enum(EstadoProyecto),
    fechaAlta: z.coerce.date(),
    fechaCierre: z.coerce.date().nullable(),
  })
  .strict()

export const busquedaProyectosSchema = z.object({
  habilidades: z
    .union([objectIdSchema, z.array(objectIdSchema)])
    .transform((habilidades) => [habilidades].flat())
    .optional(),
})
