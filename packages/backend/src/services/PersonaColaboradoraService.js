import { NivelCoincidencia } from "../domain/enums/NivelCoincidencia.js"
import {
  EntityNotFound,
  NoAutorizado,
  InvalidReference,
} from "../errors/ApplicationErrors.js"
import { RolUsuario } from "../domain/enums/RolUsuario.js"
import PersonaColaboradora from "../domain/PersonaColaboradora.js"
import Cuenta from "../domain/Cuenta.js"
import MedioDeContacto from "../domain/MedioDeContacto.js"
const idDe = (habilidad) => String(habilidad._id ?? habilidad.id ?? habilidad)

const esTotal = ({ nivel }) => nivel === NivelCoincidencia.TOTAL

const esMejor = (una, otra) =>
  esTotal(una) !== esTotal(otra)
    ? esTotal(una)
    : una.opcionalesCubiertas > otra.opcionalesCubiertas

export default class PersonaColaboradoraService {
  constructor(
    proyectoRepository,
    personaColaboradoraRepository,
    habilidadService,
    postulacionRepository,
    notificacionRepository,
    usuarioRepository,
  ) {
    this.proyectoRepository = proyectoRepository
    this.personaColaboradoraRepository = personaColaboradoraRepository
    this.habilidadService = habilidadService
    this.postulacionRepository = postulacionRepository
    this.notificacionRepository = notificacionRepository
    this.usuarioRepository = usuarioRepository
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
    await this.postulacionRepository.deleteByPersona(id)
    await this.notificacionRepository.deleteByPersonaColaboradora(id)
    await this.usuarioRepository.deleteByEntidad(id)
    await this.personaColaboradoraRepository.deleteById(id)
  }

  deleteMedioDeContacto = async (id, contactoId) => {
    const eliminado =
      await this.personaColaboradoraRepository.eliminarMedioDeContacto(
        id,
        contactoId,
      )
    if (!eliminado) {
      await this.getById(id)
      throw new EntityNotFound("Medio de contacto no encontrado")
    }
  }

  // Personas con al menos una habilidad requerida de alguno de los perfiles.
  // Primero las de coincidencia total y, a igual nivel, las que cubren más
  // habilidades opcionales. Con varios perfiles cuenta la mejor coincidencia.
  getAllByPerfiles = async (perfilesIds) => {
    const candidatasPorId = new Map()

    for (const perfilId of perfilesIds) {
      const { proyecto, perfil } =
        await this.proyectoRepository.findProyectoYPerfilPorId(perfilId)

      if (!proyecto || !perfil) {
        throw new EntityNotFound("Perfil no encontrado")
      }

      proyecto.assertPuedeBuscarColaboradores()

      const personas =
        await this.personaColaboradoraRepository.findConAlgunaHabilidad(
          perfil.habilidadesRequeridas,
        )

      const inscriptas = new Set(
        await this.postulacionRepository.findPersonasInscriptasEn(proyecto.id),
      )

      for (const persona of personas) {
        const personaId = String(persona.id)
        const coincidencia = perfil.coincidenciaCon(persona.habilidades)
        if (!coincidencia || inscriptas.has(personaId)) {
          continue
        }

        const anterior = candidatasPorId.get(personaId)
        if (!anterior || esMejor(coincidencia, anterior.coincidencia)) {
          candidatasPorId.set(personaId, { persona, coincidencia })
        }
      }
    }

    return [...candidatasPorId.values()]
      .toSorted((una, otra) =>
        esMejor(una.coincidencia, otra.coincidencia)
          ? -1
          : esMejor(otra.coincidencia, una.coincidencia)
            ? 1
            : 0,
      )
      .map(({ persona, coincidencia }) => ({
        ...(persona.toJSON ? persona.toJSON() : { ...persona }),
        coincidencia: coincidencia.nivel,
        habilidadesCoincidentes: coincidencia.coincidentes.map(idDe),
        habilidadesRequeridasFaltantes: coincidencia.faltantes.map(idDe),
        habilidadesOpcionalesCubiertas: coincidencia.opcionalesCubiertas,
      }))
  }

  getById = async (id) => {
    const personaColaboradora =
      await this.personaColaboradoraRepository.findById(id)
    if (!personaColaboradora) {
      throw new EntityNotFound("Persona colaboradora no encontrada")
    }
    return personaColaboradora
  }

  getAllByPostulacionAceptada = async (perfilId) => {
    const { proyecto, perfil } =
      await this.proyectoRepository.findProyectoYPerfilPorId(perfilId)

    if (!proyecto || !perfil) {
      throw new InvalidReference("Perfil no encontrado")
    }
    const postulaciones = await Promise.all(
      perfil.postulacionesAceptadas.map((id) =>
        this.postulacionRepository.findById(id),
      ),
    )
    const colaboradores = await Promise.all(
      postulaciones
        .filter((postulacion) => postulacion !== null)
        .map(async (postulacion) => {
          // Si es anónima, no recuperamos ni exponemos sus datos personales.
          if (postulacion.esAnonima) {
            return {
              esAnonima: true,
            }
          }

          const persona = await this.personaColaboradoraRepository.findById(
            postulacion.personaColaboradora,
          )

          if (!persona) return null

          return {
            id: persona.id,
            esAnonima: false,
            nombre: persona.nombre,
            apellido: persona.apellido,
            nombreFantasia: persona.nombreFantasia,
            pronombres: persona.pronombres,
            presentacion: persona.presentacion,
            habilidades: persona.habilidades,
            cuentas: persona.cuentas,
          }
        }),
    )
    return colaboradores
  }

  puedeVerContactoDe = async (personaId, usuario) => {
    if (usuario.rol === RolUsuario.PERSONA_COLABORADORA) {
      return usuario.entidad === personaId
    }
    const proyectos = await this.proyectoRepository.findByColectivoId(
      usuario.entidad,
    )
    return await this.postulacionRepository.existeDePersonaEnProyectos(
      personaId,
      proyectos.map((proyecto) => proyecto.id),
    )
  }

  mediosDeContactoPara = async (personaId, usuario) => {
    const persona = await this.getById(personaId)
    if (!(await this.puedeVerContactoDe(personaId, usuario))) {
      throw new NoAutorizado(
        "No tenés acceso a los datos de contacto de esta persona",
      )
    }
    return persona.mediosDeContacto.map(({ id, tipo, valor }) => ({
      id,
      tipo,
      valor,
    }))
  }

  async getAll(queryParams = {}) {
    const { page = 1, limit = 10, ...criterios } = queryParams
    const query = {}

    if (criterios.q) {
      query.$or = [
        { nombre: { $regex: criterios.q, $options: "i" } },
        { apellido: { $regex: criterios.q, $options: "i" } },
        { nombreFantasia: { $regex: criterios.q, $options: "i" } },
      ]
    }

    if (criterios.habilidades && criterios.habilidades.length > 0) {
      query.habilidades = { $in: criterios.habilidades }
    }

    const skip = (page - 1) * limit

    const { colaboradoras, total } =
      await this.personaColaboradoraRepository.findAll(query, skip, limit)

    const dataCensurada = colaboradoras.map((colab) => {
      const obj = colab.toJSON ? colab.toJSON() : { ...colab }
      if (obj.mediosDeContacto) {
        obj.mediosDeContacto = obj.mediosDeContacto.map((mc) => ({
          id: mc.id || mc._id.toString(), // Nos aseguramos de devolver 'id'
          tipo: mc.tipo,
        }))
      }
      return obj
    })

    return {
      metadata: { page, limit, total },
      data: dataCensurada,
    }
  }
}
