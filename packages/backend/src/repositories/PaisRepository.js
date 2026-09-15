export default class PaisRepository {
  constructor() {
    this.paises = []
  }


  findById(id) {
    return this.paises.find((pais) => pais.id === id)
  }

  save(pais) {
    const indice = this.paises.findIndex((p) => p.id === pais.id)
    if(indice === -1) {
      this.paises.push(pais)
      return pais
    }

    this.paises[indice] = pais
    return pais
  }

}