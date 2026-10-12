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

  create = async (proyectoId, datos) => {
    const proyecto = await this.proyectoService.getById(proyectoId)
    const perfil = proyecto.agregarPerfil(
      new Perfil(await this.resolverHabilidades(datos)),
    )
    await this.proyectoRepository.save(proyecto)
    return await this.getById(proyectoId, perfil.id)
  }

  update = async (proyectoId, perfilId, datos) => {
    const proyecto = await this.proyectoService.getById(proyectoId)
    const perfil = this.buscarPerfil(proyecto, perfilId)
    proyecto.actualizarPerfil(perfil, await this.resolverHabilidades(datos))
    await this.proyectoRepository.save(proyecto)
    return await this.getById(proyectoId, perfilId)
  }

  delete = async (proyectoId, perfilId) => {
    const proyecto = await this.proyectoService.getById(proyectoId)
    this.buscarPerfil(proyecto, perfilId)
    proyecto.eliminarPerfil(perfilId)
    await this.proyectoRepository.save(proyecto)
  }

  getById = async (proyectoId, perfilId) => {
    const proyecto = await this.proyectoService.getById(proyectoId)
    return this.buscarPerfil(proyecto, perfilId)
  }

  getAllByProyectoId = async (proyectoId) => {
    const proyecto = await this.proyectoService.getById(proyectoId)
    return proyecto.perfiles
  }
}
