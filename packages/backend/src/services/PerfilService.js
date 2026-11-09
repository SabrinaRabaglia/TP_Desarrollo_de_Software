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

  resolverHabilidades = async (datos) => ({
    ...datos,
    habilidadesRequeridas: await this.habilidadService.buscarReferenciadas(
      datos.habilidadesRequeridas,
    ),
    habilidadesOpcionales: await this.habilidadService.buscarReferenciadas(
      datos.habilidadesOpcionales,
    ),
  })

  armarPerfil = async (datos) =>
    new Perfil(await this.resolverHabilidades(datos))

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

  update = async (proyectoId, perfilId, datos) => {
    const perfil = await this.proyectoRepository.actualizarPerfil(
      proyectoId,
      perfilId,
      await this.armarPerfil(datos),
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
