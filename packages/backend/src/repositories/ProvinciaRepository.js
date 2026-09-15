export default class ProvinciaRepository {
  constructor() {
    this.provincias = []
  }


  findById(id) {
    return this.provincias.find((provincia) => provincia.id === id)
  }

  save(provincia) {
    const indice = this.provincias.findIndex((p) => p.id === provincia.id)
    if(indice === -1) {
      this.provincias.push(provincia)
      return provincia
    }

    this.provincias[indice] = provincia
    return provincia
  }

}