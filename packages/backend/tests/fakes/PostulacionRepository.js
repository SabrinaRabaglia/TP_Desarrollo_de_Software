import ProyectoRepository from "./ProyectoRepository.js"

export default class PostulacionRepository {
  constructor() {
    this.postulaciones = []
  }

  async findAll() {
    return this.postulaciones
  }

  async findById(id) {
    return this.postulaciones.find((p) => String(p.id ?? p._id) === String(id))
  }

  async findAllByColaborador(colaboradorId) {
    return this.postulaciones.filter(
      (p) =>
        String(p.personaColaboradora?.id ?? p.personaColaboradora?._id ?? p.personaColaboradora) ===
        String(colaboradorId),
    )
  }

  async findAllByPerfil(perfilId) {
    return this.postulaciones.filter(
      (p) =>
        String(p.perfil?.id ?? p.perfil?._id ?? p.perfil) === String(perfilId),
    )
  }

  async findByPersonaAndPerfil(personaId, perfilId) {
    return this.postulaciones.find(
      (p) =>
        String(p.personaColaboradora?.id ?? p.personaColaboradora?._id ?? p.personaColaboradora) ===
          String(personaId) &&
        String(p.perfil?.id ?? p.perfil?._id ?? p.perfil) === String(perfilId),
    )
  }

  async findPersonasInscriptasEn(proyectoId) {
    const proyecto = ProyectoRepository.proyectos.find(
      (p) => String(p.id ?? p._id) === String(proyectoId),
    )
    const perfilesIds = (proyecto?.perfiles ?? []).map((p) =>
      String(p.id ?? p._id),
    )
    return this.postulaciones
      .filter(
        (p) =>
          String(p.proyecto?.id ?? p.proyecto?._id ?? p.proyecto) ===
            String(proyectoId) ||
          perfilesIds.includes(
            String(p.perfil?.id ?? p.perfil?._id ?? p.perfil),
          ),
      )
      .map((p) =>
        String(p.personaColaboradora?.id ?? p.personaColaboradora?._id ?? p.personaColaboradora),
      )
  }

  async existeDePersonaEnProyectos(personaId, proyectoIds) {
    const ids = proyectoIds.map(String)
    const proyectos = ProyectoRepository.proyectos.filter((p) =>
      ids.includes(String(p.id ?? p._id)),
    )
    const perfilesIds = proyectos.flatMap((p) =>
      (p.perfiles ?? []).map((perf) => String(perf.id ?? perf._id)),
    )
    return this.postulaciones.some(
      (p) =>
        String(p.personaColaboradora?.id ?? p.personaColaboradora?._id ?? p.personaColaboradora) ===
          String(personaId) &&
        (ids.includes(String(p.proyecto?.id ?? p.proyecto?._id ?? p.proyecto)) ||
          perfilesIds.includes(
            String(p.perfil?.id ?? p.perfil?._id ?? p.perfil),
          )),
    )
  }

  async deleteByPerfil(perfilId) {
    this.postulaciones = this.postulaciones.filter(
      (p) =>
        String(p.perfil?.id ?? p.perfil?._id ?? p.perfil) !== String(perfilId),
    )
  }

  async deleteByPersona(personaId) {
    this.postulaciones = this.postulaciones.filter(
      (p) =>
        String(p.personaColaboradora?.id ?? p.personaColaboradora?._id ?? p.personaColaboradora) !==
        String(personaId),
    )
  }

  async save(postulacion) {
    if (!postulacion.id && !postulacion._id) {
      postulacion.id = `postulacion-${this.postulaciones.length + 1}`
    }
    const index = this.postulaciones.findIndex(
      (p) => String(p.id ?? p._id) === String(postulacion.id ?? postulacion._id),
    )
    if (index >= 0) {
      this.postulaciones[index] = postulacion
    } else {
      this.postulaciones.push(postulacion)
    }
    return postulacion
  }

  deleteAll() {
    this.postulaciones = []
  }
}
