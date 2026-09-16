import Pais from '../domain/Pais.js';
export default class PaisRepository {
  constructor() {
    this.paises = [new Pais("1", "Argentina")]
  }


  async findById(id) {
    return this.paises.find((pais) => pais.id === id)
  }

  async save(pais) {
    const indice = this.paises.findIndex((p) => p.id === pais.id)
    if(indice === -1) {
      this.paises.push(pais)
      return pais
    }

    this.paises[indice] = pais
    return pais
  }

}