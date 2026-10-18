import { z } from "zod"
import { BadRequestError } from "../errors/ApplicationErrors.js"
import { objectIdSchema } from "../validations/objectId.js"

const colectivoSchema = z
  .object({
    nombre: z.string(),
    descripcion: z.string().min(2).max(500),
    tipo: z.string(),
    pais: objectIdSchema.nullable().optional(),
    provincia: objectIdSchema.nullable().optional(),
    ciudad: z.string().nullable().optional(),
  })
  .strict()
export default class ColectivoController {
  constructor(colectivoService) {
    this.colectivoService = colectivoService
  }

  getAll = async (req, res, next) => {
    try {
      res.status(200).json(await this.colectivoService.getAll())
    } catch (error) {
      next(error)
    }
  }
  getById = async (req, res, next) => {
    const { id } = req.params
    try {
      res.status(200).json(await this.colectivoService.getById(id))
    } catch (error) {
      next(error)
    }
  }
  create = async (req, res, next) => {
    try {
      const body = req.body
      const resultado = colectivoSchema.safeParse(body)
      if (resultado.error) {
        throw new BadRequestError("Datos inválidos", resultado.error.issues)
      }
      const creado = await this.colectivoService.create(resultado.data)
      res.status(201).json(creado)
    } catch (error) {
      next(error)
    }
  }
  put = async (req, res, next) => {
    try {
      const body = req.body
      const resultado = colectivoSchema.safeParse(body)
      if (resultado.error) {
        throw new BadRequestError("Datos inválidos", resultado.error.issues)
      }
      const id = req.params.id
      const actualizado = await this.colectivoService.update(id, resultado.data)
      res.status(200).json(actualizado)
    } catch (error) {
      next(error)
    }
  }
  patch = async (req, res, next) => {
    try {
      const { id } = req.params
      const resultado = colectivoSchema.partial().safeParse(req.body)
      if (resultado.error) {
        throw new BadRequestError("Datos inválidos", resultado.error.issues)
      }
      const colectivoActualizado = await this.colectivoService.patch(
        id,
        resultado.data,
      )
      res.status(200).json(colectivoActualizado)
    } catch (error) {
      next(error)
    }
  }

  delete = async (req, res, next) => {
    try {
      const { id } = req.params
      await this.colectivoService.delete(id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
