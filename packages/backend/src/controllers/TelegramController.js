export default class TelegramController {
  constructor(conexionDeTelegram) {
    this.conexionDeTelegram = conexionDeTelegram
  }

  crearEnlace = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(await this.conexionDeTelegram.crearEnlace(req.params.id))
    } catch (error) {
      next(error)
    }
  }
}
