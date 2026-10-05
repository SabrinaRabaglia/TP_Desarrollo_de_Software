import { randomUUID } from "node:crypto"
export default class ProyectoRepository {
  
  static proyectos = []
  
  constructor() {

    //this.proyectos = []
  }

  async findAll() {
    return ProyectoRepository.proyectos
  }

  async findById(id) {
    return ProyectoRepository.proyectos.find((c) => c.id === id)
  }

  async   findByTitulo(titulo) {
    return ProyectoRepository.proyectos.find((c) => c.titulo === titulo)
  }

  async findByColectivoId(colectivoId) {
    return ProyectoRepository.proyectos.filter(
      (proyecto) => proyecto.colectivo === colectivoId,
    )
  }

  async save(nuevo) {
    nuevo.id ??= randomUUID()
    const indice = ProyectoRepository.proyectos.findIndex((p) => p.id === nuevo.id)
    if (indice === -1) {
      ProyectoRepository.proyectos.push(nuevo)
      return nuevo
    }
    ProyectoRepository.proyectos[indice] = nuevo
    return nuevo
  }

  async delete(id) {
    ProyectoRepository.proyectos = ProyectoRepository.proyectos.filter((c) => c.id !== id)
  }
  deleteAll() {
   ProyectoRepository.proyectos.length = 0; 
}
}

export { ProyectoRepository }
