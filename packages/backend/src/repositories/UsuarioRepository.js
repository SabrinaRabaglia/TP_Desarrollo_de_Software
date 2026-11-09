import UsuarioModel from "../schemas/usuarioSchema.js"
import guardar from "./guardar.js"

export default class UsuarioRepository {
  constructor() {
    this.model = UsuarioModel
  }

  async findByEmail(email) {
    return await this.model.findOne({ email })
  }

  async findById(id) {
    return await this.model.findById(id)
  }

  async save(usuario) {
    return await guardar(this.model, usuario)
  }
}
