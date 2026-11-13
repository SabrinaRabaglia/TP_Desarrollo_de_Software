export default class ColaboracionRepository {
  constructor() {
    this.colaboraciones = []
  }

  async findAll() {
    return this.colaboraciones
  }

  async findByPersonaAndProyecto(personaId, proyectoId) {
    return this.colaboraciones.find(
      (c) =>
        c.personaColaboradora.id === personaId && c.proyecto.id === proyectoId,
    )
  }

  async countByProyectoAndPerfil(proyectoId, perfilId) {
    return this.colaboraciones.filter(
      (c) => c.proyecto.id === proyectoId && c.perfilId === perfilId,
    ).length
  }

  async findPersonasInscriptasEn(proyectoId) {
    return this.colaboraciones
      .filter((c) => c.proyecto.id === proyectoId)
      .map((c) => c.personaColaboradora.id)
  }

  async deleteByProyecto(proyectoId) {
    this.colaboraciones = this.colaboraciones.filter(
      (c) => c.proyecto.id !== proyectoId,
    )
  }

  async deleteByPersona(personaId) {
    this.colaboraciones = this.colaboraciones.filter(
      (c) => c.personaColaboradora.id !== personaId,
    )
  }

  async save(colaboracion) {
    this.colaboraciones.push(colaboracion)
    return colaboracion
  }
}
