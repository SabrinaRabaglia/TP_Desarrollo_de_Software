export default class HabilidadRepository {
  constructor() {
    this.habilidades = []
  }
 
  getAll() {
    return this.habilidades
  }
 
  findByCodigo(codigo) {
    return this.habilidades.find((h) => h.codigo === codigo)
  }
 
  save(habilidad) {
    const indice = this.habilidades.findIndex((h) => h.id === habilidad.id)
    if (indice === -1) {
      this.habilidades.push(habilidad)
      return habilidad
    }
    this.habilidades[indice] = habilidad
    return habilidad
  }
}
