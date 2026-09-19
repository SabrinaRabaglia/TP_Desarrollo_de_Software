import { randomUUID } from "node:crypto"
import { EntityNotFound, InvalidReference } from "../errors/ApplicationErrors.js"
import PersonaColaboradora from "../domain/PersonaColaboradora.js"
import Cuenta from "../domain/Cuenta.js"

export default class PersonaColaboradoraService {
  constructor(personaColaboradoraRepository, habilidadService) {
    this.personaColaboradoraRepository = personaColaboradoraRepository
    this.habilidadService = habilidadService
  }

  buscarHabilidades = async (ids) => {
    try {
      return await Promise.all(
        (ids ?? []).map((id) => this.habilidadService.getById(id))
      )
    } catch (error) {
      if (error instanceof EntityNotFound) {
        throw new InvalidReference(error.message)
      }
      throw error
    }
  }

  crearCuentas = (cuentas) => {
    return (cuentas ?? []).map(
      (cuenta) => new Cuenta(cuenta.nombreUsuario, cuenta.tipo),
    )
  }

  create = async (nueva) => {
    const habilidades = await this.buscarHabilidades(nueva.habilidades)
    const cuentas = this.crearCuentas(nueva.cuentas)

    const personaColaboradora = new PersonaColaboradora(
      nueva.nombreFantasia,
      nueva.nombre,
      nueva.apellido,
      nueva.pronombres,
      nueva.presentacion,
      cuentas,
      habilidades,
    )
    personaColaboradora.id = randomUUID()

    return await this.personaColaboradoraRepository.save(personaColaboradora)
  }

  update = async (id, actualizada) => {
    const personaExistente = await this.personaColaboradoraRepository.findById(id)
    if (!personaExistente) {
      throw new EntityNotFound("Persona colaboradora no encontrada")
    }

    PersonaColaboradora.validarDatos(actualizada)

    const cuentas = this.crearCuentas(actualizada.cuentas)

    const habilidades = await this.buscarHabilidades(actualizada.habilidades)

    personaExistente.nombreFantasia = actualizada.nombreFantasia
    personaExistente.nombre = actualizada.nombre ?? null
    personaExistente.apellido = actualizada.apellido ?? null
    personaExistente.pronombres = actualizada.pronombres ?? []
    personaExistente.presentacion = actualizada.presentacion ?? null
    personaExistente.cuentas = cuentas
    personaExistente.habilidades = habilidades

    return await this.personaColaboradoraRepository.save(personaExistente)
  }

  delete = async (id) => {
    const personaExistente = await this.personaColaboradoraRepository.findById(id)
    if (!personaExistente) {
      throw new EntityNotFound("Persona colaboradora no encontrada")
    }
    await this.personaColaboradoraRepository.deleteById(id)
  }

  getAll = async () => {
    return await this.personaColaboradoraRepository.getAll()
  }

  getById = async (id) => {
    const personaColaboradora = await this.personaColaboradoraRepository.findById(id)
    if (!personaColaboradora) {
      throw new EntityNotFound("Persona colaboradora no encontrada")
    }
    return personaColaboradora
  }
}
