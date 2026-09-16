export default class PersonaColaboradoraRepository {
  constructor() {
    this.personasColaboradoras = []
  }

  async getAll() {
    return this.personasColaboradoras
  }

  async findById(id) {
    return this.personasColaboradoras.find((p) => p.id === id)
  }

  async deleteById(id) {
    const indice = this.personasColaboradoras.findIndex((p) => p.id === id)
    if (indice === -1) {
      return false
    }
    this.personasColaboradoras.splice(indice, 1)
    return true
  }

  async save(personaColaboradora) {
    const indice = this.personasColaboradoras.findIndex(
      (p) => p.id === personaColaboradora.id,
    )
    if (indice === -1) {
      this.personasColaboradoras.push(personaColaboradora)
      return personaColaboradora
    }
    this.personasColaboradoras[indice] = personaColaboradora
    return personaColaboradora
  }
}
