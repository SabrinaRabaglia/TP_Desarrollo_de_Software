import { BadRequestError } from "../errors/AppError.js"
import { z } from "zod"

const habilidadSchema = z
  .object({
    titulo: z.string().min(1),
    codigo: z.string().min(1),
    descripcion: z.string().min(1),
  })
  .strict()

export default class HabilidadController {
  constructor(habilidadService) {
    this.habilidadService = habilidadService
  }

  create = async (req, res, next) => {
    try {
      const resultado = habilidadSchema.safeParse(req.body)
      if (resultado.error) {
        throw new BadRequestError("Datos inválidos", resultado.error.issues)
      }
      const habilidad = await this.habilidadService.create(resultado.data)
      res.status(201).json(habilidad)
    } catch (error) {
      next(error)
    }
  }

  update = async (req, res, next) => {
    try {
      const resultado = habilidadSchema.safeParse(req.body)
      if (resultado.error) {
        throw new BadRequestError("Datos inválidos", resultado.error.issues)
      }
      const habilidad = await this.habilidadService.update(
        req.params.id,
        resultado.data
      )
      res.status(200).json(habilidad)
    } catch (error) {
      next(error)
    }
  }

  delete = async (req, res, next) => {
    try {
      await this.habilidadService.delete(req.params.id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  getById = async (req, res, next) => {
    try {
      const habilidad = await this.habilidadService.getById(req.params.id)
      res.status(200).json(habilidad)
    } catch (error) {
      next(error)
    }
  }

  getAll = async (req, res, next) => {
    try {
      res.status(200).json(await this.habilidadService.getAll())
    } catch (error) {
      next(error)
    }
  }
}
