import HabilidadService from "../services/HabilidadService.js"
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
  constructor(habilidadService = new HabilidadService()) {
    this.habilidadService = habilidadService
  }
 
  create = (req, res) => {
    const resultado = habilidadSchema.safeParse(req.body)
    if (resultado.error) {
      throw new BadRequestError("Datos inválidos", resultado.error.issues)
    }
    const habilidad = this.habilidadService.create(resultado.data)
    res.status(201).json(habilidad)
  }
 
  update = (req, res) => {
    const resultado = habilidadSchema.safeParse(req.body)
    if (resultado.error) {
      throw new BadRequestError("Datos inválidos", resultado.error.issues)
    }
    const habilidad = this.habilidadService.update(req.params.id, resultado.data)
    res.status(200).json(habilidad)
  }

  delete = (req, res) => {
    this.habilidadService.delete(req.params.id)
    res.status(204).send()
  }

  getById = (req, res) => {
    const habilidad = this.habilidadService.getById(req.params.id)
    res.status(200).json(habilidad)
  }

  getAll = (req, res) => {
    res.status(200).json(this.habilidadService.getAll())
  }
}
