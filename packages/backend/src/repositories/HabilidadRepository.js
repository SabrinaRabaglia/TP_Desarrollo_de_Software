export default class HabilidadRepository {
  constructor() {
    this.habilidades = []
  }

  async getAll() {
    return this.habilidades
  }

  async findByCodigo(codigo) {
    return this.habilidades.find((h) => h.codigo === codigo)
  }

  async findById(id) {
    return this.habilidades.find((h) => h.id === id)
  }

  async deleteById(id) {
    const indice = this.habilidades.findIndex((h) => h.id === id)
    if (indice === -1) {
      return false
    }
    this.habilidades.splice(indice, 1)
    return true
  }

  async save(habilidad) {
    const indice = this.habilidades.findIndex((h) => h.id === habilidad.id)
    if (indice === -1) {
      this.habilidades.push(habilidad)
      return habilidad
    }
    this.habilidades[indice] = habilidad
    return habilidad
  }
}
