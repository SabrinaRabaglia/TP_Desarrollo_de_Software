import {
  ConcurrentModification,
  EntityNotFound,
} from "../errors/ApplicationErrors.js"
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

  rechazar = (proyecto, hito) => {
    proyecto.assertAdmiteHito(hito)
    throw new ConcurrentModification(
      "El proyecto cambió mientras se procesaba el hito. Volvé a intentar.",
    )
  }

  create = async (proyectoId, datos) => {
    const hito = new Hito(
      datos.fecha,
      datos.porcentajeConcrecion,
      datos.descripcion,
    )
    const creado = await this.proyectoRepository.agregarHito(proyectoId, hito)
    if (!creado) {
      this.rechazar(await this.proyectoService.getById(proyectoId), hito)
    }
    return creado
  }

  update = async (hitoId, cambios) => {
    Hito.validarCambios(cambios)
    const hito = await this.proyectoRepository.actualizarHito(hitoId, cambios)
    if (!hito) {
      const proyecto = await this.proyectoRepository.findByHitoId(hitoId)
      if (!proyecto) {
        throw new EntityNotFound("Hito no encontrado")
      }
      this.rechazar(proyecto, cambios)
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
