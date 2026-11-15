import Postulacion from "../domain/Postulacion.js"
import { EstadoPostulacion } from "../domain/enums/EstadoPostulacion.js"
import { OrigenBaja } from "../domain/enums/OrigenBaja.js"
import { RolUsuario } from "../domain/enums/RolUsuario.js"
import {
  AlreadyExists,
  InvalidReference,
  NoAutorizado,
} from "../errors/ApplicationErrors.js"

export default class PostulacionService {
  constructor(
    colectivoRepository,
    postulacionRepository,
    proyectoRepository,
    personaColaboradoraRepository,
  ) {
    this.colectivoRepository = colectivoRepository
    this.postulacionRepository = postulacionRepository
    this.proyectoRepository = proyectoRepository
    this.personaColaboradoraRepository = personaColaboradoraRepository
  }

  create = async ({ perfilId, personaColaboradoraId, esAnonima }) => {
    const { proyecto, perfil } =
      await this.proyectoRepository.findProyectoYPerfilPorId(perfilId)

    if (!proyecto || !perfil) {
      throw new InvalidReference("Perfil no encontrado")
    }
    const persona = await this.personaColaboradoraRepository.findById(
      personaColaboradoraId,
    )
    if (!persona) {
      throw new InvalidReference("Persona colaboradora no encontrada")
    }
    if (
      await this.postulacionRepository.findByPersonaAndPerfil(
        personaColaboradoraId,
        perfilId,
      )
    ) {
      throw new AlreadyExists("La persona ya se postulo en este perfil")
    }
    proyecto.assertPuedeBuscarColaboradores()
    perfil.assertBusquedaAbierta()
    return await this.postulacionRepository.save(
      new Postulacion(persona, perfil, esAnonima),
    )
  }

  getAllByColaborador = async (colaboradorId) => {
    const persona =
      await this.personaColaboradoraRepository.findById(colaboradorId)
    if (!persona) {
      throw new InvalidReference("Persona no encontrada")
    }
    const postulaciones =
      await this.postulacionRepository.findAllByColaborador(colaboradorId)
    return await Promise.all(
      postulaciones.map(async (postulacion) => {
        // La postulación guarda solo el id del perfil (vive embebido en el proyecto).
        const { proyecto, perfil } =
          await this.proyectoRepository.findProyectoYPerfilPorId(
            postulacion.perfil,
          )

        return {
          ...postulacion.toObject(),
          proyecto: proyecto
            ? {
                id: proyecto.id,
                titulo: proyecto.titulo,
              }
            : null,
          perfil: perfil
            ? {
                id: perfil.id,
                nombre: perfil.nombre,
              }
            : null,
        }
      }),
    )
  }

  getAllByPerfil = async (perfilId, colectivoId) => {
    const { proyecto, perfil } =
      await this.proyectoRepository.findProyectoYPerfilPorId(perfilId)

    if (!proyecto || !perfil) {
      throw new InvalidReference("Perfil no encontrado")
    }

    const colectivo = await this.colectivoRepository.findById(colectivoId)
    if (!colectivo) {
      throw new InvalidReference("Colectivo no encontrado")
    }
    if (!proyecto.esDelColectivo(colectivoId)) {
      throw new NoAutorizado(
        "El proyecto no pertenece al colectivo autenticado",
      )
    }

    const postulaciones =
      await this.postulacionRepository.findAllByPerfil(perfilId)
    const response = await Promise.all(
      postulaciones.map(async (postulacion) => {
        const persona = await this.personaColaboradoraRepository.findById(
          postulacion.personaColaboradora,
        )

        return {
          _id: postulacion._id,
          estado: postulacion.estado,
          // El colectivo ve a la persona igual (el anonimato es hacia el
          // público), pero tiene que saber que pidió no figurar.
          esAnonima: postulacion.esAnonima,
          fechaPostulacion: postulacion.fechaPostulacion,
          fechaRevision: postulacion.fechaRevision,
          fechaBaja: postulacion.fechaBaja,
          origenBaja: postulacion.origenBaja,
          personaColaboradora: persona
            ? {
                id: persona.id,
                nombre: persona.nombre,
                apellido: persona.apellido,
                nombreFantasia: persona.nombreFantasia,
                pronombres: persona.pronombres,
                presentacion: persona.presentacion,
                habilidades: persona.habilidades,
                cuentas: persona.cuentas,
                // Como en los datos de contacto: el colectivo los ve recién
                // cuando la persona colabora, es decir, con la postulación aceptada.
                mediosDeContacto:
                  postulacion.estado === EstadoPostulacion.ACEPTADA
                    ? persona.mediosDeContacto.map((m) => ({
                        id: m.id,
                        tipo: m.tipo,
                        valor: m.valor,
                      }))
                    : [],
              }
            : null,
        }
      }),
    )
    return response
  }

  getById = async (id) => {
    const postulacion = await this.postulacionRepository.findById(id)
    if (!postulacion) {
      throw new InvalidReference("Postulacion no encontrada")
    }
    return postulacion
  }

  // Solo el colectivo dueño del proyecto revisa las postulaciones de sus perfiles.
  // La postulación con el proyecto y el perfil al que pertenece.
  postulacionConSuPerfil = async (id) => {
    const postulacion = await this.postulacionRepository.findById(id)
    if (!postulacion) {
      throw new InvalidReference("Postulacion no encontrada")
    }
    const { proyecto, perfil } =
      await this.proyectoRepository.findProyectoYPerfilPorId(postulacion.perfil)
    if (!proyecto || !perfil) {
      throw new InvalidReference("Perfil no encontrado")
    }
    return { postulacion, proyecto, perfil }
  }

  postulacionARevisar = async (id, colectivoId) => {
    const { postulacion, proyecto, perfil } =
      await this.postulacionConSuPerfil(id)
    if (!proyecto.esDelColectivo(colectivoId)) {
      throw new NoAutorizado(
        "El proyecto no pertenece al colectivo autenticado",
      )
    }
    return { postulacion, proyecto, perfil }
  }

  aceptar = async (id, colectivoId) => {
    const { postulacion, proyecto, perfil } = await this.postulacionARevisar(
      id,
      colectivoId,
    )
    // Primero el estado: una postulación ya resuelta se rechaza por eso, haya
    // o no lugar en el perfil.
    postulacion.assertPendiente("aceptar")
    perfil.assertPuedeAceptarPostulaciones()
    postulacion.aceptar()
    perfil.agregarPostulacion(id)
    await this.proyectoRepository.save(proyecto)
    return await this.postulacionRepository.save(postulacion)
  }

  rechazar = async (id, colectivoId) => {
    const { postulacion } = await this.postulacionARevisar(id, colectivoId)
    postulacion.rechazar()
    return await this.postulacionRepository.save(postulacion)
  }

  // La persona se da de baja de su propia postulación; el colectivo desanota
  // solo en sus proyectos. Cualquier otro caso no está autorizado.
  origenDeBaja = (usuario, postulacion, proyecto) => {
    if (
      usuario.rol === RolUsuario.PERSONA_COLABORADORA &&
      postulacion.esDe(usuario.entidad)
    ) {
      return OrigenBaja.PERSONA_COLABORADORA
    }
    if (
      usuario.rol === RolUsuario.COLECTIVO &&
      proyecto.esDelColectivo(usuario.entidad)
    ) {
      return OrigenBaja.COLECTIVO
    }
    throw new NoAutorizado("No podés dar de baja esta postulación")
  }

  darDeBaja = async (id, usuario) => {
    const { postulacion, proyecto, perfil } =
      await this.postulacionConSuPerfil(id)
    postulacion.darDeBaja(this.origenDeBaja(usuario, postulacion, proyecto))
    perfil.quitarPostulacion(id)
    await this.proyectoRepository.save(proyecto)
    return await this.postulacionRepository.save(postulacion)
  }
}
