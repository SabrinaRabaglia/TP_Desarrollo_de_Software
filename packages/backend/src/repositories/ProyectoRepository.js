export default class ProyectoRepository {
  constructor() {
    this.proyectos = []
  }

  async findAll() {
    return this.proyectos
  }

  async findById(id) {
    return this.proyectos.find((c) => c.id === id)
  }

  async   findByTitulo(titulo) {
    return this.proyectos.find((c) => c.titulo === titulo)
  }

  async findByColectivoId(colectivoId) {
    return this.proyectos.filter(
      (proyecto) => proyecto.colectivo === colectivoId,
    )
  }

  async save(nuevo) {
    const indice = this.proyectos.findIndex((p) => p.id === nuevo.id)
    if (indice === -1) {
      this.proyectos.push(nuevo)
      return nuevo
    }
    this.proyectos[indice] = nuevo
    return nuevo
  }

  async delete(id) {
    this.proyectos = this.proyectos.filter((c) => c.id !== id)
  }
}

export { ProyectoRepository }
