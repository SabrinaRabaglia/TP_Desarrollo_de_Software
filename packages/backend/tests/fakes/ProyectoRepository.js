import nuevoId from "./nuevoId.js"
import { EstadoProyecto } from "../../src/domain/enums/EstadoProyecto.js"
import { inicioDelDiaSiguiente } from "../../src/domain/fechas.js"

export default class ProyectoRepository {
  static proyectos = []

  static abierto(proyectoId) {
    const proyecto = ProyectoRepository.proyectos.find(
      (p) => p.id === proyectoId,
    )
    return proyecto?.estado === EstadoProyecto.CERRADO ? undefined : proyecto
  }

  static conHito(hitoId) {
    return ProyectoRepository.proyectos.find((proyecto) =>
      proyecto.hitos.some((hito) => hito.id === hitoId),
    )
  }

  async findAll() {
    return {
      proyectos: ProyectoRepository.proyectos,
      total: ProyectoRepository.proyectos.length,
    }
  }

  async findById(id) {
    return ProyectoRepository.proyectos.find((c) => c.id === id)
  }

  async findByTitulo(titulo) {
    return ProyectoRepository.proyectos.find((c) => c.titulo === titulo)
  }

  async findByColectivoId(colectivoId) {
    return ProyectoRepository.proyectos.filter(
      (proyecto) => proyecto.colectivo === colectivoId,
    )
  }

  async findByEstadoYAlgunaHabilidadRequerida(estado, habilidadesIds) {
    return ProyectoRepository.proyectos.filter(
      (proyecto) =>
        proyecto.estado === estado &&
        proyecto.perfiles.some((perfil) =>
          perfil.habilidadesRequeridas.some((id) =>
            habilidadesIds.includes(String(id)),
          ),
        ),
    )
  }

  async findConPerfilesQueRequieran(estado, habilidadesIds) {
    return await this.findByEstadoYAlgunaHabilidadRequerida(
      estado,
      habilidadesIds,
    )
  }

  async findProyectoYPerfilPorId(perfilId) {
    for (const proyecto of ProyectoRepository.proyectos) {
      const perfil = proyecto.perfiles.find((p) => p.id === perfilId)
      if (perfil) {
        return { proyecto, perfil }
      }
    }
    return { proyecto: null, perfil: null }
  }

  async existePerfilConHabilidad(habilidadId) {
    const usa = (habilidades) =>
      habilidades.some(
        (habilidad) => (habilidad.id ?? habilidad) === habilidadId,
      )
    return ProyectoRepository.proyectos.some((proyecto) =>
      proyecto.perfiles.some(
        (perfil) =>
          usa(perfil.habilidadesRequeridas) ||
          usa(perfil.habilidadesOpcionales),
      ),
    )
  }

  async save(nuevo) {
    nuevo.id ??= nuevoId()
    for (const perfil of nuevo.perfiles ?? []) {
      perfil.id ??= nuevoId()
    }
    const indice = ProyectoRepository.proyectos.findIndex(
      (p) => p.id === nuevo.id,
    )
    if (indice === -1) {
      ProyectoRepository.proyectos.push(nuevo)
      return nuevo
    }
    ProyectoRepository.proyectos[indice] = nuevo
    return nuevo
  }

  async deleteById(id) {
    ProyectoRepository.proyectos = ProyectoRepository.proyectos.filter(
      (c) => c.id !== id,
    )
  }

  async agregarPerfil(proyectoId, perfil) {
    const proyecto = ProyectoRepository.abierto(proyectoId)
    if (!proyecto) {
      return null
    }
    perfil.id = nuevoId()
    proyecto.perfiles.push(perfil)
    return perfil
  }

  async actualizarPerfil(proyectoId, perfilId, perfil) {
    const proyecto = ProyectoRepository.abierto(proyectoId)
    const indice = proyecto?.perfiles.findIndex((p) => p.id === perfilId)
    if (!proyecto || indice === -1) {
      return null
    }
    perfil.id = perfilId
    proyecto.perfiles[indice] = perfil
    return perfil
  }

  async eliminarPerfil(proyectoId, perfilId) {
    const proyecto = ProyectoRepository.abierto(proyectoId)
    if (!proyecto?.perfiles.some((p) => p.id === perfilId)) {
      return false
    }
    proyecto.perfiles = proyecto.perfiles.filter((p) => p.id !== perfilId)
    return true
  }

  async findByHitoId(hitoId) {
    return ProyectoRepository.conHito(hitoId)
  }

  async agregarHito(proyectoId, hito) {
    const proyecto = await this.findById(proyectoId)
    if (!proyecto || proyecto.fechaAlta >= inicioDelDiaSiguiente(hito.fecha)) {
      return null
    }
    hito.id = nuevoId()
    proyecto.hitos.push(hito)
    return hito
  }

  async actualizarHito(hitoId, cambios) {
    const proyecto = ProyectoRepository.conHito(hitoId)
    const hito = proyecto?.hitos.find((h) => h.id === hitoId)
    if (
      !hito ||
      (cambios.fecha !== undefined &&
        proyecto.fechaAlta >= inicioDelDiaSiguiente(cambios.fecha))
    ) {
      return null
    }
    return Object.assign(hito, cambios)
  }

  async eliminarHito(hitoId) {
    const proyecto = ProyectoRepository.conHito(hitoId)
    if (!proyecto) {
      return false
    }
    proyecto.hitos = proyecto.hitos.filter((hito) => hito.id !== hitoId)
    return true
  }
  deleteAll() {
    ProyectoRepository.proyectos.length = 0
  }
}
