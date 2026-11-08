import { personaColaboradoraDTO } from "../dtos/personaColaboradoraDTO.js"

export default class PersonaColaboradoraController {
  constructor(personaColaboradoraService) {
    this.personaColaboradoraService = personaColaboradoraService
  }

  create = async (req, res, next) => {
    try {
      const personaColaboradora = await this.personaColaboradoraService.create(
        req.body,
      )
      res.status(201).json(personaColaboradoraDTO(personaColaboradora))
    } catch (error) {
      next(error)
    }
  }

  update = async (req, res, next) => {
    try {
      const personaColaboradora = await this.personaColaboradoraService.update(
        req.params.id,
        req.body,
      )
      res.status(200).json(personaColaboradoraDTO(personaColaboradora))
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

  deleteMedioDeContacto = async (req, res, next) => {
    try {
      await this.personaColaboradoraService.deleteMedioDeContacto(
        req.params.id,
        req.params.contactoId,
      )
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
      res.status(200).json(personaColaboradoraDTO(personaColaboradora))
    } catch (error) {
      next(error)
    }
  }

  getAll = async (req, res, next) => {
    try {
      const personas = await this.personaColaboradoraService.getAll()
      res.status(200).json(personas.map(personaColaboradoraDTO))
    } catch (error) {
      next(error)
    }
  }
}
