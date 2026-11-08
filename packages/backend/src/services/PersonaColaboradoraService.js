import { EntityNotFound } from "../errors/ApplicationErrors.js"
import PersonaColaboradora from "../domain/PersonaColaboradora.js"
import Cuenta from "../domain/Cuenta.js"
import MedioDeContacto from "../domain/MedioDeContacto.js"
export default class PersonaColaboradoraService {
  constructor(
    proyectoRepository,
    personaColaboradoraRepository,
    habilidadService,
    colaboracionRepository,
    notificacionRepository,
  ) {
    this.proyectoRepository = proyectoRepository
    this.personaColaboradoraRepository = personaColaboradoraRepository
    this.habilidadService = habilidadService
    this.colaboracionRepository = colaboracionRepository
    this.notificacionRepository = notificacionRepository
  }

  crearCuentas = (cuentas) => {
    return (cuentas ?? []).map(
      (cuenta) => new Cuenta(cuenta.nombreUsuario, cuenta.tipo),
    )
  }
  crearMediosDeContacto = (medios, preservarIds = false) => {
    return (medios ?? []).map(
      (medio) =>
        new MedioDeContacto(
          medio.tipo,
          medio.valor,
          preservarIds ? medio.id : undefined,
        ),
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
      mediosDeContacto,
    )
    return await this.personaColaboradoraRepository.save(personaColaboradora)
  }

  update = async (id, actualizada) => {
    const personaExistente = await this.getById(id)

    PersonaColaboradora.validarDatos(actualizada)

    const cuentas = this.crearCuentas(actualizada.cuentas)
    const mediosDeContacto =
      actualizada.mediosDeContacto === undefined
        ? personaExistente.mediosDeContacto
        : this.crearMediosDeContacto(actualizada.mediosDeContacto, true)

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
    personaExistente.aceptaMensajeriaInterna =
      actualizada.aceptaMensajeriaInterna ?? false
    personaExistente.mediosDeContacto = mediosDeContacto

    return await this.personaColaboradoraRepository.save(personaExistente)
  }
  delete = async (id) => {
    await this.getById(id)
    await this.colaboracionRepository.deleteByPersona(id)
    await this.notificacionRepository.deleteByPersonaColaboradora(id)
    await this.personaColaboradoraRepository.deleteById(id)
  }

  deleteMedioDeContacto = async (id, contactoId) => {
    const personaColaboradora = await this.getById(id)
    const indice = personaColaboradora.mediosDeContacto.findIndex(
      (medio) => String(medio._id ?? medio.id) === contactoId,
    )
    if (indice === -1) {
      throw new EntityNotFound("Medio de contacto no encontrado")
    }

    personaColaboradora.mediosDeContacto.splice(indice, 1)
    return await this.personaColaboradoraRepository.save(personaColaboradora)
  }

  getAll = async () => {
    return await this.personaColaboradoraRepository.findAll()
  }

  getAllByPerfiles = async (perfilesIds) => {
    const personasPorId = new Map()

    for (const perfilId of perfilesIds) {
      const { proyecto, perfil } =
        await this.proyectoRepository.findProyectoYPerfilPorId(perfilId)

      if (!proyecto || !perfil) {
        throw new EntityNotFound("Perfil no encontrado")
      }

      proyecto.assertPuedeBuscarColaboradores()

      const personas = await this.getAllConHabilidades(
        perfil.habilidadesRequeridas,
      )

      const inscriptas = new Set(
        await this.colaboracionRepository.findPersonasInscriptasEn(proyecto.id),
      )

      for (const persona of personas) {
        if (inscriptas.has(String(persona.id))) {
          continue
        }

        const puntaje = perfil.cantidadDeHabilidadesOpcionalesDe(persona)
        const personaId = String(persona.id)

        const personaRegistrada = personasPorId.get(personaId)

        if (!personaRegistrada || puntaje > personaRegistrada.puntaje) {
          personasPorId.set(personaId, {
            persona,
            puntaje,
          })
        }
      }
    }

    return [...personasPorId.values()]
      .toSorted((una, otra) => otra.puntaje - una.puntaje)
      .map(({ persona }) => persona)
  }

  getAllConHabilidades = async (habilidades) => {
    return await this.personaColaboradoraRepository.findConTodasLasHabilidades(
      habilidades,
    )
  }

  getById = async (id) => {
    const personaColaboradora =
      await this.personaColaboradoraRepository.findById(id)
    if (!personaColaboradora) {
      throw new EntityNotFound("Persona colaboradora no encontrada")
    }
    return personaColaboradora
  }
}
