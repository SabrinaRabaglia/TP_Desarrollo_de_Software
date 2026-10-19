import { z } from "zod";

export const hitoSchema = z.object({
  fecha: z.coerce.date(),
  porcentajeConcrecion: z.number().int().min(0).max(100),
  descripcion: z.string()
}).strict();