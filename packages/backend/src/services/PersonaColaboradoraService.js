import { EntityNotFound } from "../errors/ApplicationErrors.js"
import PersonaColaboradora from "../domain/PersonaColaboradora.js"
import Cuenta from "../domain/Cuenta.js"
import MedioDeContacto from "../domain/MedioDeContacto.js"
export default class PersonaColaboradoraService {
  constructor(
    personaColaboradoraRepository,
    habilidadService,
    colaboracionRepository,
    proyectoRepository,
  ) {
    this.personaColaboradoraRepository = personaColaboradoraRepository
    this.habilidadService = habilidadService
    this.colaboracionRepository = colaboracionRepository
    this.proyectoRepository = proyectoRepository
  }

  crearCuentas = (cuentas) => {
    return (cuentas ?? []).map(
      (cuenta) => new Cuenta(cuenta.nombreUsuario, cuenta.tipo),
    )
  }
  crearMediosDeContacto = (medios) => {
    return (medios ?? []).map(
      (medio) => new MedioDeContacto(medio.tipo, medio.valor)
    )
  }
  create = async (nueva) => {
    const habilidades = await this.habilidadService.buscarReferenciadas(
      nueva.habilidades ?? [],
    )
    const cuentas = this.crearCuentas(nueva.cuentas)
    const mediosDeContacto = this.crearMediosDeContacto(nueva.mediosDeContacto)

    const personaColaboradora = new PersonaColaboradora(
      nueva.nombreFantasia,
      nueva.nombre,
      nueva.apellido,
      nueva.pronombres,
      nueva.presentacion,
      cuentas,
      habilidades,
      nueva.aceptaMensajeriaInterna,
      mediosDeContacto
    )
    return await this.personaColaboradoraRepository.save(personaColaboradora)
  }

  update = async (id, actualizada) => {
    const personaExistente = await this.personaColaboradoraRepository.findById(id)
    if (!personaExistente) {
      throw new EntityNotFound("Persona colaboradora no encontrada")
    }

    PersonaColaboradora.validarDatos(actualizada)

    const cuentas = this.crearCuentas(actualizada.cuentas)
    const mediosDeContacto =
      actualizada.mediosDeContacto === undefined
        ? personaExistente.mediosDeContacto
        : this.crearMediosDeContacto(actualizada.mediosDeContacto)

    const habilidades = await this.habilidadService.buscarReferenciadas(
      actualizada.habilidades ?? [],
    )

    personaExistente.nombreFantasia = actualizada.nombreFantasia
    personaExistente.nombre = actualizada.nombre ?? null
    personaExistente.apellido = actualizada.apellido ?? null
    personaExistente.pronombres = actualizada.pronombres ?? []
    personaExistente.presentacion = actualizada.presentacion ?? null
    personaExistente.cuentas = cuentas
    personaExistente.habilidades = habilidades
    personaExistente.aceptaMensajeriaInterna = actualizada.aceptaMensajeriaInterna ?? false
    personaExistente.mediosDeContacto = mediosDeContacto

    return await this.personaColaboradoraRepository.save(personaExistente)
  }
  delete = async (id) => {
    const personaExistente = await this.personaColaboradoraRepository.findById(id)
    if (!personaExistente) {
      throw new EntityNotFound("Persona colaboradora no encontrada")
    }
    await this.colaboracionRepository.deleteByPersona(id)
    await this.personaColaboradoraRepository.deleteById(id)
  }

  getAll = async () => {
    return await this.personaColaboradoraRepository.getAll()
  }

  getAllByPerfil = async (perfilId) => {
    const perfil = await this.proyectoRepository.findPerfilById(perfilId)
    if (!perfil) {
        throw new EntityNotFound("Perfil no encontrado");
    }

    return await this.personaColaboradoraRepository.findByHabilidadesRequeridas(
        perfil.habilidadesRequeridas
    )
  }

  getById = async (id) => {
    const personaColaboradora = await this.personaColaboradoraRepository.findById(id)
    if (!personaColaboradora) {
      throw new EntityNotFound("Persona colaboradora no encontrada")
    }
    return personaColaboradora
  }
}
