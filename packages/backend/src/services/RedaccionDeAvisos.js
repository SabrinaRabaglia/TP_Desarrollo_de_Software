import { redactarAvisoExterno } from "../domain/avisoExterno.js"

export default class RedaccionDeAvisos {
  constructor(colectivoRepository, proyectoRepository, urlDeLaPlataforma) {
    this.colectivoRepository = colectivoRepository
    this.proyectoRepository = proyectoRepository
    this.urlDeLaPlataforma = urlDeLaPlataforma
  }

  redactar = async (notificacion) => {
    const [colectivo, { proyecto, perfil }] = await Promise.all([
      this.colectivoRepository.findById(notificacion.colectivo),
      this.proyectoRepository.findProyectoYPerfilPorId(notificacion.perfil),
    ])
    return redactarAvisoExterno({
      colectivo: colectivo?.nombre ?? null,
      proyecto: proyecto?.titulo ?? null,
      perfil: perfil?.nombre ?? null,
      contenido: notificacion.contenido,
      urlDeLaPlataforma: this.urlDeLaPlataforma,
    })
  }
}
