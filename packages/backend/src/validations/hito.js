import { z } from "zod"
import { inicioDelDiaSiguiente } from "../domain/fechas.js"

export const hitoSchema = z
  .object({
    fecha: z
      .union([z.iso.date(), z.iso.datetime({ offset: true, local: true })])
      .pipe(z.coerce.date())
      .refine((fecha) => fecha < inicioDelDiaSiguiente(new Date()), {
        message: "La fecha del hito no puede ser futura",
      }),
    porcentajeConcrecion: z.number().int().min(0).max(100),
    descripcion: z.string().trim().min(1),
  })
  .strict()

export const cambiosDeHitoSchema = hitoSchema.partial()
