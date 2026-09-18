export default class PersonaColaboradoraRepository {
  static personas = [];
  constructor() {
    //this.personasColaboradoras = []
  }

  async getAll() {
    return PersonaColaboradoraRepository.personas
  }

  async findById(id) {
    return PersonaColaboradoraRepository.personas.find((p) => p.id === id)
  }

  async deleteById(id) {
    const indice = PersonaColaboradoraRepository.personas.findIndex((p) => p.id === id)
    if (indice === -1) {
      return false
    }
    PersonaColaboradoraRepository.personas.splice(indice, 1)
    return true
  }

  async save(personaColaboradora) {
    const indice = PersonaColaboradoraRepository.personas.findIndex(
      (p) => p.id === personaColaboradora.id,
    )
    if (indice === -1) {
      PersonaColaboradoraRepository.personas.push(personaColaboradora)
      return personaColaboradora
    }
    PersonaColaboradoraRepository.personas[indice] = personaColaboradora
    return personaColaboradora
  }
  deleteAll() {
   PersonaColaboradoraRepository.personas.length = 0; 
  }
  
}
