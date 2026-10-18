import {
  AlreadyExists,
  EntityInUse,
  EntityNotFound,
  InvalidReference,
} from "../errors/ApplicationErrors.js"
import Habilidad from "../domain/Habilidad.js"

export default class HabilidadService {
  constructor(
    habilidadRepository,
    personaColaboradoraRepository,
    proyectoRepository,
  ) {
    this.habilidadRepository = habilidadRepository
    this.personaColaboradoraRepository = personaColaboradoraRepository
    this.proyectoRepository = proyectoRepository
  }

  create = async (nueva) => {
    const habilidad = new Habilidad(
      nueva.titulo,
      nueva.codigo,
      nueva.descripcion,
    )
    const habilidadExistente = await this.habilidadRepository.findByCodigo(
      nueva.codigo,
    )
    if (habilidadExistente) {
      throw new AlreadyExists("Ya existe una habilidad con ese código")
    }
    return await this.habilidadRepository.save(habilidad)
  }

  update = async (id, actualizada) => {
    const habilidadExistente = await this.getById(id)

    Habilidad.validarDatos(actualizada)

    const otraConMismoCodigo = await this.habilidadRepository.findByCodigo(
      actualizada.codigo,
    )
    if (otraConMismoCodigo && otraConMismoCodigo.id !== id) {
      throw new AlreadyExists("Ya existe una habilidad con ese código")
    }

    habilidadExistente.titulo = actualizada.titulo
    habilidadExistente.codigo = actualizada.codigo
    habilidadExistente.descripcion = actualizada.descripcion

    return await this.habilidadRepository.save(habilidadExistente)
  }

  delete = async (id) => {
    await this.getById(id)
    // Restringimos en vez de sacarla de todos lados: un perfil sin habilidades
    // quedaría inválido para el dominio.
    if (
      (await this.personaColaboradoraRepository.existeConHabilidad(id)) ||
      (await this.proyectoRepository.existePerfilConHabilidad(id))
    ) {
      throw new EntityInUse(
        "La habilidad está en uso por personas colaboradoras o perfiles de proyectos",
      )
    }
    await this.habilidadRepository.deleteById(id)
  }

  getById = async (id) => {
    const habilidad = await this.habilidadRepository.findById(id)

    if (!habilidad) {
      throw new EntityNotFound("Habilidad no encontrada")
    }
    return habilidad
  }

  buscarReferenciadas = async (ids) => {
    try {
      return await Promise.all(ids.map((id) => this.getById(id)))
    } catch (error) {
      if (error instanceof EntityNotFound) {
        throw new InvalidReference(error.message)
      }
      throw error
    }
  }

  getAll = async () => {
    return await this.habilidadRepository.findAll()
  }
}
