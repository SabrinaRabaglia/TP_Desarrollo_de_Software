export default class ColaboracionRepository {
  constructor() {
    this.colaboraciones = []
  }

  getAll() {
    return this.colaboraciones
  }

  getAllFilteredByProyecto(titulo) {
    return this.colaboraciones.filter((c) => c.proyecto.titulo.includes(titulo))
  }

  getAllFilteredByColaborador(nombre) {
    return this.colaboraciones.filter(
      (c) => c.personaColaboradora.nombre === nombre,
    )
  }

  findByPersonaAndProyecto(personaId, proyectoId) {
    return this.colaboraciones.find(
      (c) =>
        c.personaColaboradora.id === personaId && c.proyecto.id === proyectoId,
    )
  }

  save(colaboracion) {
    this.colaboraciones.push(colaboracion)
    return colaboracion
  }
}
