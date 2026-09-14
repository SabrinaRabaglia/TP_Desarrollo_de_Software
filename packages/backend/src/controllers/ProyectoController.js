import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js"
import { z } from "zod"
import { ModalidadColaboracion } from "../domain/enums/ModalidadColaboracion.js"
import { UnidadCompromiso } from "../domain/enums/UnidadCompromiso.js"
import { BadRequestError } from "../errors/AppError.js"

const proyectoSchema = z
  .object({
    titulo: z.string(),
    descripcion: z.string(),
    unidadCompromiso: z.nativeEnum(UnidadCompromiso),
    cantHoras: z.number().int().positive(),
    colectivo: z.string(),
    modalidadesColaboracion: z
      .array(z.nativeEnum(ModalidadColaboracion))
      .min(1),
    habilidadesRequeridas: z.array(z.string()),
    estado: z.nativeEnum(EstadoProyecto),
    fechaAlta: z.coerce.date(),
    fechaCierre: z.coerce.date().nullable(),
  })
  .strict()

export default class ProyectoController {
  constructor(proyectoService) {
    this.proyectoService = proyectoService
  }

  getAll = (req, res) => {
    res.status(200).json(this.proyectoService.getAll())
  }

  getById = (req, res) => {
    const { id } = req.params
    res.status(200).json(this.proyectoService.getById(id))
  }

  create = (req, res) => {
    const body = req.body
    const resultado = proyectoSchema.safeParse(body)
    if (resultado.error) {
      throw new BadRequestError("Datos inválidos", resultado.error.issues)
    }
    const creado = this.proyectoService.create(resultado.data)
    res.status(201).json(creado)
  }

  put = (req, res) => {
    const body = req.body
    const resultado = proyectoSchema.safeParse(body)
    if (resultado.error) {
      throw new BadRequestError("Datos inválidos", resultado.error.issues)
    }
    const id = req.params.id
    const actualizado = this.proyectoService.update(id, resultado.data)
    res.status(200).json(actualizado)
  }

  patch = (req, res) => {
    const { id } = req.params
    const resultado = proyectoSchema.partial().safeParse(req.body)
    if (resultado.error) {
      throw new BadRequestError("Datos inválidos", resultado.error.issues)
    }
    const proyectoActualizado = this.proyectoService.update(id, resultado.data)
    res.status(200).json(proyectoActualizado)
  }

  cerrar = (req, res) => {
    const proyecto = this.proyectoService.cerrarProyecto(req.params.id)
    res.status(200).json(proyecto)
  }

  delete = (req, res) => {
    const { id } = req.params
    this.proyectoService.delete(id)
    res.status(204).send()
  }
}
