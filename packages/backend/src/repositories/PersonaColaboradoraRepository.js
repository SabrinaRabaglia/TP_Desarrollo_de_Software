class PersonaColaboradoraRepository {
  constructor() {
    this.personasColaboradoras = []
  }

  getAll() {
    return this.personasColaboradoras
  }

  findById(id) {
    return this.personasColaboradoras.find((p) => p.id === id)
  }

  deleteById(id) {
    const indice = this.personasColaboradoras.findIndex((p) => p.id === id)
    if (indice === -1) {
      return false
    }
    this.personasColaboradoras.splice(indice, 1)
    return true
  }

  save(personaColaboradora) {
    const indice = this.personasColaboradoras.findIndex((p) => p.id === personaColaboradora.id)
    if (indice === -1) {
      this.personasColaboradoras.push(personaColaboradora)
      return personaColaboradora
    }
    this.personasColaboradoras[indice] = personaColaboradora
    return personaColaboradora
  }
}
const personaColaboradoraRepository = new PersonaColaboradoraRepository();
export default personaColaboradoraRepository;