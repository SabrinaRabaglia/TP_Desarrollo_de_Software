export default class ColectivoRepository {
  constructor() {
    this.colectivos = []
  }
  async findAll() {
    return this.colectivos
  }

  async findById(id) {
    return this.colectivos.find((c) => c.id === id)
  }
  async findByNombre(nombre) {
    return this.colectivos.find((c) => c.nombre === nombre)
  }

  async save(nuevo) {
    const indice = this.colectivos.findIndex((c) => c.id === nuevo.id)
    if (indice === -1) {
      this.colectivos.push(nuevo)
      return nuevo
    }
    this.colectivos[indice] = nuevo
    return nuevo
  }
  async delete(id) {
    this.colectivos = this.colectivos.filter((c) => c.id !== id)
  }
}
