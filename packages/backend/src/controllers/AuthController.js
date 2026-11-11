export default class AuthController {
  constructor(authService) {
    this.authService = authService
  }

  login = async (req, res, next) => {
    try {
      res
        .status(200)
        .json(await this.authService.login(req.body.email, req.body.contrasena))
    } catch (error) {
      next(error)
    }
  }

  registrarPersonaColaboradora = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(await this.authService.registrarPersonaColaboradora(req.body))
    } catch (error) {
      next(error)
    }
  }

  me = async (req, res, next) => {
    try {
      res.status(200).json(await this.authService.usuarioActual(req.usuario.id))
    } catch (error) {
      next(error)
    }
  }
}
