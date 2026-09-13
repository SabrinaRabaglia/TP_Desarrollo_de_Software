import { ConflictError, NotFoundError } from "../errors/AppError.js"
import Habilidad from "../domain/Habilidad.js"

export default class HabilidadService {
  constructor(habilidadRepository) {
    this.habilidadRepository = habilidadRepository
  }

  create = (nueva) => {
    const habilidad = new Habilidad(
      nueva.titulo,
      nueva.codigo,
      nueva.descripcion,
    )
    const habilidadExistente = this.habilidadRepository.findByCodigo(
      nueva.codigo,
    )
    if (habilidadExistente) {
      throw new ConflictError(
        `Ya existe una habilidad con código: ${nueva.codigo}`,
      )
    }
    return this.habilidadRepository.save(habilidad)
  }

  update = (id, actualizada) => {
    const habilidadExistente = this.habilidadRepository.findById(id)
    if (!habilidadExistente) {
      throw new NotFoundError("Habilidad no encontrada")
    }

    Habilidad.validarDatos(actualizada)

    const otraConMismoCodigo = this.habilidadRepository.findByCodigo(
      actualizada.codigo,
    )
    if (otraConMismoCodigo && otraConMismoCodigo.id !== id) {
      throw new ConflictError(
        `Ya existe una habilidad con código: ${actualizada.codigo}`,
      )
    }

    habilidadExistente.titulo = actualizada.titulo
    habilidadExistente.codigo = actualizada.codigo
    habilidadExistente.descripcion = actualizada.descripcion

    return this.habilidadRepository.save(habilidadExistente)
  }

  delete = (id) => {
    const habilidadExistente = this.habilidadRepository.findById(id)
    if (!habilidadExistente) {
      throw new NotFoundError("Habilidad no encontrada")
    }
    this.habilidadRepository.deleteById(id)
  }

  getById = (id) => {
    const habilidad = this.habilidadRepository.findById(id)
    if (!habilidad) {
      throw new NotFoundError("Habilidad no encontrada")
    }
    return habilidad
  }

  getAll = () => {
    return this.habilidadRepository.getAll()
  }
}
