export default class PersonaColaboradoraRepository {
  constructor() {
    this.personasColaboradoras = []
  }

  getAll() {
    return this.personasColaboradoras
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