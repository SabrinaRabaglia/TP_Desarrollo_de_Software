export default class ColectivoRepository {

  static colectivos = []
  constructor() {
    //this.colectivos = []
  }
  async findAll() {
    return ColectivoRepository.colectivos
  }

  async findById(id) {
    return ColectivoRepository.colectivos.find((c) => c.id === id)
  }
  async findByNombre(nombre) {
    return ColectivoRepository.colectivos.find((c) => c.nombre === nombre)
  }

  async save(nuevo) {
    const indice = ColectivoRepository.colectivos.findIndex((c) => c.id === nuevo.id)
    if (indice === -1) {
      ColectivoRepository.colectivos.push(nuevo)
      return nuevo
    }
    ColectivoRepository.colectivos[indice] = nuevo
    return nuevo
  }
  async delete(id) {
    ColectivoRepository.colectivos = ColectivoRepository.colectivos.filter((c) => c.id !== id)
  }

  deleteAll() {
   ColectivoRepository.colectivos.length = 0; 
}
}
