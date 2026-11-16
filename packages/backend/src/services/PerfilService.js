import Perfil from "../domain/Perfil.js"
import { EstadoProyecto } from "../domain/enums/EstadoProyecto.js"
import { OrdenDeBusqueda } from "../validations/perfil.js"
import { EntityNotFound } from "../errors/ApplicationErrors.js"

const idDe = (documento) => String(documento._id ?? documento.id ?? documento)

// Cada perfil encontrado con lo que la persona necesita para decidir, sin el
// resto del proyecto.
const aResultado = ({ proyecto, perfil, coincidencia }) => ({
  proyecto: {
    id: idDe(proyecto),
    titulo: proyecto.titulo,
    fechaAlta: proyecto.fechaAlta,
    colectivo: {
      id: idDe(proyecto.colectivo),
      nombre: proyecto.colectivo.nombre ?? null,
    },
  },
  perfil: {
    id: idDe(perfil),
    nombre: perfil.nombre,
    descripcion: perfil.descripcion,
    unidadCompromiso: perfil.unidadCompromiso,
    cantidadHoras: perfil.cantidadHoras,
    modalidadesColaboracion: perfil.modalidadesColaboracion,
    limiteColaboraciones: perfil.limiteColaboraciones,
    cuposDisponibles: perfil.cuposDisponibles(),
  },
  coincidencia: coincidencia.nivel,
  habilidadesRequeridasFaltantes: coincidencia.faltantes.map((habilidad) => ({
    id: idDe(habilidad),
    titulo: habilidad.titulo ?? null,
  })),
})

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

  // Perfiles con la búsqueda abierta, de proyectos publicados, que piden al
  // menos una de las habilidades. La consulta trae los proyectos candidatos y
  // el dominio decide perfil por perfil.
  buscarAbiertos = async (
    { habilidades, modalidad, orden, page, limit },
    ahora = new Date(),
  ) => {
    const proyectos = await this.proyectoRepository.findConPerfilesQueRequieran(
      EstadoProyecto.PUBLICADO,
      habilidades,
    )
    const sentido = orden === OrdenDeBusqueda.ANTIGUOS ? 1 : -1
    const encontrados = proyectos
      .toSorted((uno, otro) => sentido * (uno.fechaAlta - otro.fechaAlta))
      .flatMap((proyecto) =>
        proyecto.perfiles
          .filter(
            (perfil) =>
              perfil.tieneBusquedaAbierta(ahora) &&
              (!modalidad || perfil.admiteModalidad(modalidad)),
          )
          .map((perfil) => ({
            proyecto,
            perfil,
            coincidencia: perfil.coincidenciaCon(habilidades),
          }))
          .filter(({ coincidencia }) => coincidencia),
      )
    const desde = (page - 1) * limit
    return {
      metadata: { page, limit, total: encontrados.length },
      data: encontrados.slice(desde, desde + limit).map(aResultado),
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
