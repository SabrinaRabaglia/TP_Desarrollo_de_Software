export default class PersonaColaboradoraController {
  constructor(personaColaboradoraService) {
    this.personaColaboradoraService = personaColaboradoraService
  }

  create = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(await this.personaColaboradoraService.create(req.body))
    } catch (error) {
      next(error)
    }
  }

  update = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(
          await this.personaColaboradoraService.update(req.params.id, req.body),
        )
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
      res
        .status(200)
        .json(await this.personaColaboradoraService.getById(req.params.id))
    } catch (error) {
      next(error)
    }
  }

  getAll = async (req, res, next) => {
    try {
      const perfiles = req.query.perfiles ? [].concat(req.query.perfiles) : null
      const personas = perfiles
        ? await this.personaColaboradoraService.getAllByPerfiles(perfiles)
        : await this.personaColaboradoraService.getAll()
      res.status(200).json(personas)
    } catch (error) {
      next(error)
    }
  }
}
