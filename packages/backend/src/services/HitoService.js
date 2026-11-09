import { EntityNotFound } from "../errors/ApplicationErrors.js"
import { Hito } from "../domain/Hito.js"

export default class HitoService {
  constructor(proyectoService, proyectoRepository) {
    this.proyectoService = proyectoService
    this.proyectoRepository = proyectoRepository
  }

  getByProyectoId = async (proyectoId) => {
    const proyecto = await this.proyectoService.getById(proyectoId)
    return proyecto.hitos
  }

  create = async (proyectoId, datos) => {
    const hito = await this.proyectoRepository.agregarHito(
      proyectoId,
      new Hito(datos.fecha, datos.porcentajeConcrecion, datos.descripcion),
    )
    if (!hito) {
      await this.proyectoService.getById(proyectoId)
    }
    return hito
  }

  update = async (hitoId, cambios) => {
    const hito = await this.proyectoRepository.actualizarHito(hitoId, cambios)
    if (!hito) {
      throw new EntityNotFound("Hito no encontrado")
    }
    return hito
  }

  delete = async (hitoId) => {
    const eliminado = await this.proyectoRepository.eliminarHito(hitoId)
    if (!eliminado) {
      throw new EntityNotFound("Hito no encontrado")
    }
  }
}
