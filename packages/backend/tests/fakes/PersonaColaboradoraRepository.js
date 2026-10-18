import { randomUUID } from "node:crypto"
export default class PersonaColaboradoraRepository {
  static personas = []

  async findAll() {
    return PersonaColaboradoraRepository.personas
  }

  async findById(id) {
    return PersonaColaboradoraRepository.personas.find((p) => p.id === id)
  }

  async findConTodasLasHabilidades(habilidades) {
    const idDe = (habilidad) => habilidad.id ?? habilidad
    return PersonaColaboradoraRepository.personas.filter((persona) =>
      habilidades.every((requerida) =>
        persona.habilidades.some(
          (habilidad) => idDe(habilidad) === idDe(requerida),
        ),
      ),
    )
  }

  async existeConHabilidad(habilidadId) {
    return PersonaColaboradoraRepository.personas.some((persona) =>
      persona.habilidades.some(
        (habilidad) => (habilidad.id ?? habilidad) === habilidadId,
      ),
    )
  }

  async deleteById(id) {
    const indice = PersonaColaboradoraRepository.personas.findIndex(
      (p) => p.id === id,
    )
    if (indice !== -1) {
      PersonaColaboradoraRepository.personas.splice(indice, 1)
    }
  }

  async save(personaColaboradora) {
    personaColaboradora.id ??= randomUUID()
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
    PersonaColaboradoraRepository.personas.length = 0
  }
}
