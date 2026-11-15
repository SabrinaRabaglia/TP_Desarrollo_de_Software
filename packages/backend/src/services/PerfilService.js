import Perfil from "../domain/Perfil.js"
import { EntityNotFound } from "../errors/ApplicationErrors.js"

export default class PerfilService {
  constructor(proyectoService, proyectoRepository, habilidadService) {
    this.proyectoService = proyectoService
    this.proyectoRepository = proyectoRepository
    this.habilidadService = habilidadService
  }

  buscarPerfil = (proyecto, perfilId) => {
    const perfil = proyecto.buscarPerfil(perfilId)
    if (!perfil) {
      throw new EntityNotFound("Perfil no encontrado")
    }
    return perfil
  }

  // Cambia los ids de habilidades por las habilidades, para rechazar los que
  // no existen. En una edición parcial pueden no venir.
  resolverHabilidades = async (datos) => {
    const resueltos = { ...datos }
    for (const campo of ["habilidadesRequeridas", "habilidadesOpcionales"]) {
      if (datos[campo] !== undefined) {
        resueltos[campo] = await this.habilidadService.buscarReferenciadas(
          datos[campo],
        )
      }
    }
    return resueltos
  }

  armarPerfil = async (datos) => {
    const perfil = new Perfil(await this.resolverHabilidades(datos))
    perfil.assertFechaLimiteFutura()
    return perfil
  }

  rechazar = async (proyectoId, perfilId) => {
    const proyecto = await this.proyectoService.getById(proyectoId)
    proyecto.assertPuedeModificarPerfiles()
    if (perfilId !== undefined) {
      this.buscarPerfil(proyecto, perfilId)
    }
  }

  create = async (proyectoId, datos) => {
    const perfil = await this.proyectoRepository.agregarPerfil(
      proyectoId,
      await this.armarPerfil(datos),
    )
    if (!perfil) {
      await this.rechazar(proyectoId)
    }
    return perfil
  }

  // PUT: llegan todos los datos editables y reemplazan a los anteriores.
  update = async (proyectoId, perfilId, datos) =>
    await this.reemplazar(proyectoId, perfilId, () => datos)

  // PATCH: llegan algunos y el resto queda como estaba.
  modificar = async (proyectoId, perfilId, cambios) =>
    await this.reemplazar(proyectoId, perfilId, (actual) => ({
      ...actual.datosEditables(),
      ...cambios,
    }))

  reemplazar = async (proyectoId, perfilId, datosPara) => {
    const { proyecto, perfil: actual } = await this.buscarEnProyecto(
      proyectoId,
      perfilId,
    )
    proyecto.assertPuedeModificarPerfiles()
    const cambios = await this.resolverHabilidades(datosPara(actual))
    const perfil = await this.proyectoRepository.actualizarPerfil(
      proyectoId,
      perfilId,
      actual.reemplazarDatos(cambios),
    )
    if (!perfil) {
      await this.rechazar(proyectoId, perfilId)
    }
    return perfil
  }

  delete = async (proyectoId, perfilId) => {
    const eliminado = await this.proyectoRepository.eliminarPerfil(
      proyectoId,
      perfilId,
    )
    if (!eliminado) {
      await this.rechazar(proyectoId, perfilId)
    }
  }

  buscarEnProyecto = async (proyectoId, perfilId) => {
    const proyecto = await this.proyectoService.getById(proyectoId)
    return { proyecto, perfil: this.buscarPerfil(proyecto, perfilId) }
  }

  getById = async (proyectoId, perfilId) => {
    const { perfil } = await this.buscarEnProyecto(proyectoId, perfilId)
    return perfil
  }

  getAllByProyectoId = async (proyectoId) => {
    const proyecto = await this.proyectoService.getById(proyectoId)
    return proyecto.perfiles
  }
}
