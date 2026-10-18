import { personaColaboradoraDTO } from "../dtos/personaColaboradoraDTO.js"
import { perfilDTO } from "../dtos/perfilDTO.js"

export default class PerfilController {
  constructor(perfilService) {
    this.perfilService = perfilService
  }

  create = async (req, res, next) => {
    try {
      const perfil = await this.perfilService.create(req.params.id, req.body)
      res.status(201).json(perfilDTO(perfil))
    } catch (error) {
      next(error)
    }
  }

  update = async (req, res, next) => {
    try {
      const perfil = await this.perfilService.update(
        req.params.id,
        req.params.perfilId,
        req.body,
      )
      res.status(200).json(perfilDTO(perfil))
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
      res.status(200).json(perfilDTO(perfil))
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
      res.status(200).json(perfiles.map(perfilDTO))
    } catch (error) {
      next(error)
    }
  }
}
