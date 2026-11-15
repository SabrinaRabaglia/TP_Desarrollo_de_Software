import nuevoId from "./nuevoId.js"
export default class HabilidadRepository {
  static habilidades = []

  async findAll() {
    return HabilidadRepository.habilidades
  }

  async findByCodigo(codigo) {
    return HabilidadRepository.habilidades.find((h) => h.codigo === codigo)
  }

  async findById(id) {
    return HabilidadRepository.habilidades.find((h) => h.id === id)
  }

  async deleteById(id) {
    const indice = HabilidadRepository.habilidades.findIndex((h) => h.id === id)
    if (indice !== -1) {
      HabilidadRepository.habilidades.splice(indice, 1)
    }
  }

  async save(habilidad) {
    habilidad.id ??= nuevoId()
    const indice = HabilidadRepository.habilidades.findIndex(
      (h) => h.id === habilidad.id,
    )
    if (indice === -1) {
      HabilidadRepository.habilidades.push(habilidad)
      return habilidad
    }
    HabilidadRepository.habilidades[indice] = habilidad
    return habilidad
  }
  deleteAll() {
    HabilidadRepository.habilidades.length = 0
  }
}
