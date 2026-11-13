import { z } from "zod"
import { ModalidadColaboracion } from "../domain/enums/ModalidadColaboracion.js"
import { UnidadCompromiso } from "../domain/enums/UnidadCompromiso.js"
import { objectIdSchema } from "./objectId.js"

export const perfilSchema = z
  .object({
    nombre: z.string().optional(),
    descripcion: z.string(),
    unidadCompromiso: z.enum(UnidadCompromiso),
    cantidadHoras: z.number(),
    modalidadesColaboracion: z.array(z.enum(ModalidadColaboracion)),
    habilidadesRequeridas: z.array(objectIdSchema),
    habilidadesOpcionales: z.array(objectIdSchema),
    limiteColaboraciones: z.number().int().positive().nullable().optional(),
  })
  .strict()
