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

  getMediosDeContacto = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(
          await this.personaColaboradoraService.mediosDeContactoPara(
            req.params.id,
            req.usuario,
          ),
        )
    } catch (error) {
      next(error)
    }
  }

  getAll = async (req, res, next) => {
    try {
      const { perfiles, q, habilidades } = req.query

      // Soporte para API vieja
      if (perfiles && !q && !habilidades) {
        const resultados =
          await this.personaColaboradoraService.getAllByPerfiles(perfiles)
        return res.status(200).json({
          metadata: {
            page: 1,
            limit: resultados.length || 0,
            total: resultados.length || 0,
          },
          data: resultados,
        })
      }

      // SOPORTA LA NUEVA BUSQUEDA
      const respuesta = await this.personaColaboradoraService.getAll(req.query)
      return res.status(200).json(respuesta)
    } catch (error) {
      next(error)
    }
  }
}
