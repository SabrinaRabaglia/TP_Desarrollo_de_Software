import { NotFoundError } from "../errors/AppError.js"
import PersonaColaboradora from "../domain/PersonaColaboradora.js"
import Cuenta from "../domain/Cuenta.js"

export default class PersonaColaboradoraService {
  constructor(personaColaboradoraRepository, habilidadService) {
    this.personaColaboradoraRepository = personaColaboradoraRepository
    this.habilidadService = habilidadService
  }

  buscarHabilidades = (ids) => {
    return (ids ?? []).map((id) => this.habilidadService.getById(id))
  }

  crearCuentas = (cuentas) => {
    return (cuentas ?? []).map(
      (cuenta) => new Cuenta(cuenta.nombreUsuario, cuenta.tipo),
    )
  }

  create = (nueva) => {
    const habilidades = this.buscarHabilidades(nueva.habilidades)
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

    return this.personaColaboradoraRepository.save(personaColaboradora)
  }

  update = (id, actualizada) => {
    const personaExistente = this.personaColaboradoraRepository.findById(id)
    if (!personaExistente) {
      throw new NotFoundError("Persona colaboradora no encontrada")
    }

    PersonaColaboradora.validarDatos(actualizada)

    const cuentas = this.crearCuentas(actualizada.cuentas)
    const habilidades = this.buscarHabilidades(actualizada.habilidades)

    personaExistente.nombreFantasia = actualizada.nombreFantasia
    personaExistente.nombre = actualizada.nombre ?? null
    personaExistente.apellido = actualizada.apellido ?? null
    personaExistente.pronombres = actualizada.pronombres ?? []
    personaExistente.presentacion = actualizada.presentacion ?? null
    personaExistente.cuentas = cuentas
    personaExistente.habilidades = habilidades

    return this.personaColaboradoraRepository.save(personaExistente)
  }

  delete = (id) => {
    const personaExistente = this.personaColaboradoraRepository.findById(id)
    if (!personaExistente) {
      throw new NotFoundError("Persona colaboradora no encontrada")
    }
    this.personaColaboradoraRepository.deleteById(id)
  }

  getAll = () => {
    return this.personaColaboradoraRepository.getAll()
  }

  getById = (id) => {
    const personaColaboradora = this.personaColaboradoraRepository.findById(id)
    if (!personaColaboradora) {
      throw new NotFoundError("Persona colaboradora no encontrada")
    }
    return personaColaboradora
  }
}
