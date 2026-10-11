import { BadRequestError } from "../errors/AppError.js"
import { TipoCuenta } from "../domain/enums/TipoCuenta.js"
import { z } from "zod"
import { objectIdSchema } from "../validations/objectId.js"
import {TipoMedioContacto }from "../domain/enums/TipoMedioContacto.js"
const cuentaSchema = z
  .object({
    nombreUsuario: z.string(),
    tipo: z.enum(Object.values(TipoCuenta)),
  })
  .strict()
const medioDeContactoSchema = z
  .object({
    tipo: z.enum(Object.values(TipoMedioContacto)),
    valor: z.string().min(1)
  })
  .strict()
const personaColaboradoraSchema = z
  .object({
    nombreFantasia: z.string(),
    nombre: z.string().optional(),
    apellido: z.string().optional(),
    pronombres: z.array(z.string()).optional(),
    presentacion: z.string().optional(),
    cuentas: z.array(cuentaSchema).optional(),
    habilidades: z.array(objectIdSchema).optional(),
    aceptaMensajeriaInterna : z.boolean().optional().default(false),
    mediosDeContacto: z.array(medioDeContactoSchema).optional()
  })
  .strict()

export default class PersonaColaboradoraController {
  constructor(personaColaboradoraService) {
    this.personaColaboradoraService = personaColaboradoraService
  }

  create = async (req, res, next) => {
    try {
      const resultado = personaColaboradoraSchema.safeParse(req.body)
      if (resultado.error) {
        throw new BadRequestError("Datos inválidos", resultado.error.issues)
      }
      const personaColaboradora = await this.personaColaboradoraService.create(
        resultado.data,
      )
      res.status(201).json(personaColaboradora)
    } catch (error) {
      next(error)
    }
  }

  update = async (req, res, next) => {
    try {
      const resultado = personaColaboradoraSchema.safeParse(req.body)
      if (resultado.error) {
        throw new BadRequestError("Datos inválidos", resultado.error.issues)
      }
      const personaColaboradora = await this.personaColaboradoraService.update(
        req.params.id,
        resultado.data,
      )
      res.status(200).json(personaColaboradora)
    } catch (error) {
      next(error)
    }
  }

  delete = async (req, res, next) => {
    try {
      await this.personaColaboradoraService.delete(req.params.id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  getById = async (req, res, next) => {
    try {
      const personaColaboradora = await this.personaColaboradoraService.getById(
        req.params.id,
      )
      res.status(200).json(personaColaboradora)
    } catch (error) {
      next(error)
    }
  }

  getAll = async (req, res, next) => {
    try {
      res.status(200).json(await this.personaColaboradoraService.getAll())
    } catch (error) {
      next(error)
    }
  }
}
