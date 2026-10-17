import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js"
import { z } from "zod"
import { BadRequestError } from "../errors/AppError.js"
import { objectIdSchema } from "../validations/objectId.js"

const proyectoSchema = z
  .object({
    titulo: z.string(),
    descripcion: z.string(),
    colectivo: objectIdSchema,
    estado: z.enum(EstadoProyecto),
    fechaAlta: z.coerce.date(),
    fechaCierre: z.coerce.date().nullable(),
  })
  .strict()

const busquedaSchema = z.object({
  habilidades: z
    .union([objectIdSchema, z.array(objectIdSchema)])
    .transform((habilidades) => [habilidades].flat())
    .optional(),
})

export default class ProyectoController {
  constructor(proyectoService) {
    this.proyectoService = proyectoService
  }

  getAll = async (req, res, next) => {
    try {
      const resultado = busquedaSchema.safeParse(req.query)
      if (resultado.error) {
        throw new BadRequestError("Datos inválidos", resultado.error.issues)
      }
      const { habilidades } = resultado.data
      const proyectos = habilidades
        ? await this.proyectoService.getAllByHabilidades(habilidades)
        : await this.proyectoService.getAll()
      res.status(200).json(proyectos)
    } catch (error) {
      next(error)
    }
  }

  getById = async (req, res, next) => {
    try {
      const { id } = req.params
      res.status(200).json(await this.proyectoService.getById(id))
    } catch (error) {
      next(error)
    }
  }

  create = async (req, res, next) => {
    try {
      const body = req.body
      const resultado = proyectoSchema.safeParse(body)
      if (resultado.error) {
        throw new BadRequestError("Datos inválidos", resultado.error.issues)
      }
      const creado = await this.proyectoService.create(resultado.data)
      res.status(201).json(creado)
    } catch (error) {
      next(error)
    }
  }

  put = async (req, res, next) => {
    try {
      const body = req.body
      const resultado = proyectoSchema.safeParse(body)
      if (resultado.error) {
        throw new BadRequestError("Datos inválidos", resultado.error.issues)
      }
      const id = req.params.id
      const actualizado = await this.proyectoService.update(id, resultado.data)
      res.status(200).json(actualizado)
    } catch (error) {
      next(error)
    }
  }

  patch = async (req, res, next) => {
    try {
      const { id } = req.params
      const resultado = proyectoSchema.partial().safeParse(req.body)
      if (resultado.error) {
        throw new BadRequestError("Datos inválidos", resultado.error.issues)
      }
      const proyectoActualizado = await this.proyectoService.update(
        id,
        resultado.data,
      )
      res.status(200).json(proyectoActualizado)
    } catch (error) {
      next(error)
    }
  }

  delete = async (req, res, next) => {
    try {
      const { id } = req.params
      await this.proyectoService.delete(id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
