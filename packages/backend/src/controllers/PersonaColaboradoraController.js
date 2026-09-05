import { PersonaColaboradoraService } from "../services/PersonaColaboradoraService.js"
import { BadRequestError } from "../errors/AppError.js"
import { TipoCuenta } from "../domain/enums/TipoCuenta.js"
import { z } from "zod"

const cuentaSchema = z
  .object({
    nombreUsuario: z.string(),
    tipo: z.enum(Object.values(TipoCuenta)),
  }).strict()

const personaColaboradoraSchema = z
  .object({
    nombreFantasia: z.string(),
    nombre: z.string().optional(),
    apellido: z.string().optional(),
    pronombres: z.array(z.string()).optional(),
    presentacion: z.string().optional(),
    cuentas: z.array(cuentaSchema).optional(),
    habilidades: z.array(z.string()).optional(),
  }).strict()

export default class PersonaColaboradoraController {
  constructor(personaColaboradoraService = new PersonaColaboradoraService()) {
    this.personaColaboradoraService = personaColaboradoraService
  }

  create = (req, res) => {
    const resultado = personaColaboradoraSchema.safeParse(req.body)
    if (resultado.error) {
      throw new BadRequestError("Datos inválidos", resultado.error.issues)
    }
    const personaColaboradora = this.personaColaboradoraService.create(resultado.data)
    res.status(201).json(personaColaboradora)
  }

  getAll = (req, res) => {
    res.status(200).json(this.personaColaboradoraService.getAll())
  }
}