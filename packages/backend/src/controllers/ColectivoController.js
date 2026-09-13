import { z } from "zod"
import { BadRequestError } from "../errors/AppError.js"

const colectivoSchema = z
  .object({
    nombre: z.string(),
    descripcion: z.string().min(2).max(500),
    tipo: z.string(),
    pais: z.string().nullable().optional(),
    provincia: z.string().nullable().optional(),
    ciudad: z.string().nullable().optional(),
  })
  .strict()
export default class ColectivoController {
  constructor(colectivoService) {
    this.colectivoService = colectivoService
  }

  getAll = (req, res) => {
    res.status(200).json(this.colectivoService.getAll())
  }
  getById = (req, res) => {
    const { id } = req.params
    res.status(200).json(this.colectivoService.getById(id))
  }
  create = (req, res) => {
    const body = req.body
    const resultado = colectivoSchema.safeParse(body)
    if (resultado.error) {
      throw new BadRequestError("Datos inválidos", resultado.error.issues)
    }
    const creado = this.colectivoService.create(resultado.data)
    res.status(201).json(creado)
  }
  put = (req, res) => {
    const body = req.body
    const resultado = colectivoSchema.safeParse(body)
    if (resultado.error) {
      throw new BadRequestError("Datos inválidos", resultado.error.issues)
    }
    const id = req.params.id
    const actualizado = this.colectivoService.update(id, resultado.data)
    res.status(200).json(actualizado)
  }
  patch = (req, res) => {
    const { id } = req.params
    const resultado = colectivoSchema.partial().safeParse(req.body)
    if (resultado.error) {
      throw new BadRequestError("Datos inválidos", resultado.error.issues)
    }
    const colectivoActualizado = this.colectivoService.patch(id, resultado.data)
    res.status(200).json(colectivoActualizado)
  }

  delete = (req, res) => {
    const { id } = req.params
    this.colectivoService.delete(id)
    res.status(204).send()
  }
}
