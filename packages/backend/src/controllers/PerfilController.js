import { z } from "zod"
import { ModalidadColaboracion } from "../domain/enums/ModalidadColaboracion.js"
import { UnidadCompromiso } from "../domain/enums/UnidadCompromiso.js"
import { BadRequestError } from "../errors/AppError.js"
import { objectIdSchema } from "../validations/objectId.js"
import { personaColaboradoraDTO } from "../dtos/personaColaboradoraDTO.js"

const perfilSchema = z
  .object({
    nombre: z.string().optional(),
    descripcion: z.string(),
    unidadCompromiso: z.enum(UnidadCompromiso),
    cantidadHoras: z.number(),
    modalidadesColaboracion: z.array(z.enum(ModalidadColaboracion)),
    habilidadesRequeridas: z.array(objectIdSchema),
    habilidadesOpcionales: z.array(objectIdSchema),
  })
  .strict()

const validar = (body) => {
  const resultado = perfilSchema.safeParse(body)
  if (resultado.error) {
    throw new BadRequestError("Datos inválidos", resultado.error.issues)
  }
  return resultado.data
}

export default class PerfilController {
  constructor(perfilService) {
    this.perfilService = perfilService
  }

  create = async (req, res, next) => {
    try {
      const perfil = await this.perfilService.create(
        req.params.id,
        validar(req.body),
      )
      res.status(201).json(perfil)
    } catch (error) {
      next(error)
    }
  }

  update = async (req, res, next) => {
    try {
      const perfil = await this.perfilService.update(
        req.params.id,
        req.params.perfilId,
        validar(req.body),
      )
      res.status(200).json(perfil)
    } catch (error) {
      next(error)
    }
  }

  delete = async (req, res, next) => {
    try {
      await this.perfilService.delete(req.params.id, req.params.perfilId)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  getById = async (req, res, next) => {
    try {
      const perfil = await this.perfilService.getById(
        req.params.id,
        req.params.perfilId,
      )
      res.status(200).json(perfil)
    } catch (error) {
      next(error)
    }
  }

  buscarColaboradores = async (req, res, next) => {
    try {
      const personas = await this.perfilService.buscarColaboradores(
        req.params.id,
        req.params.perfilId,
      )
      res.status(200).json(personas.map(personaColaboradoraDTO))
    } catch (error) {
      next(error)
    }
  }

  getAllByProyecto = async (req, res, next) => {
    try {
      const perfiles = await this.perfilService.getAllByProyectoId(
        req.params.id,
      )
      res.status(200).json(perfiles)
    } catch (error) {
      next(error)
    }
  }
}
