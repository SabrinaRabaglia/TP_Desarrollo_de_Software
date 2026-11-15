import nuevoId from "./nuevoId.js"

export default class UsuarioRepository {
  static usuarios = []

  async findByEmail(email) {
    return UsuarioRepository.usuarios.find((u) => u.email === email)
  }

  async findById(id) {
    return UsuarioRepository.usuarios.find((u) => u.id === id)
  }

  async save(usuario) {
    usuario.id ??= nuevoId()
    const indice = UsuarioRepository.usuarios.findIndex(
      (u) => u.id === usuario.id,
    )
    if (indice === -1) {
      UsuarioRepository.usuarios.push(usuario)
    } else {
      UsuarioRepository.usuarios[indice] = usuario
    }
    return usuario
  }

  async deleteByEntidad(entidadId) {
    UsuarioRepository.usuarios = UsuarioRepository.usuarios.filter(
      (u) => String(u.entidad) !== String(entidadId),
    )
  }

  deleteAll() {
    UsuarioRepository.usuarios.length = 0
  }
}
