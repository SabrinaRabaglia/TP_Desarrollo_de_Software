import { ConflictError, NotFoundError } from "../errors/AppError.js"
import Habilidad from "../domain/Habilidad.js"

export default class HabilidadService {
  constructor(habilidadRepository) {
    this.habilidadRepository = habilidadRepository
  }

  create = async(nueva) => {
    const habilidad = new Habilidad(
      nueva.titulo,
      nueva.codigo,
      nueva.descripcion,
    )
    const habilidadExistente = await this.habilidadRepository.findByCodigo(
      nueva.codigo,
    )
    if (habilidadExistente) {
      throw new ConflictError(
        `Ya existe una habilidad con código: ${nueva.codigo}`,
      )
    }
    return await this.habilidadRepository.save(habilidad)
  }

  update = async (id, actualizada) => {
    const habilidadExistente = await this.habilidadRepository.findById(id)
    if (!habilidadExistente) {
      throw new NotFoundError("Habilidad no encontrada")
    }

    Habilidad.validarDatos(actualizada)

    const otraConMismoCodigo = await this.habilidadRepository.findByCodigo(
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

    return await this.habilidadRepository.save(habilidadExistente)
  }

  delete = async (id) => {
    const habilidadExistente = await this.habilidadRepository.findById(id)
    if (!habilidadExistente) {
      throw new NotFoundError("Habilidad no encontrada")
    }
    await this.habilidadRepository.deleteById(id)
  }

  getById = async (id) => {
    const habilidad = await this.habilidadRepository.findById(id)
    if (!habilidad) {
      throw new NotFoundError("Habilidad no encontrada")
    }
    return habilidad
  }

  getAll = async () => {
    return await this.habilidadRepository.getAll()
  }
}
