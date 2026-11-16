import api from "./api"
import { obtenerHabilidades } from "./habilidadesService"

export const ESTADOS_DE_PROYECTO = {
  PUBLICADO: "Publicado",
  CERRADO: "Cerrado",
}

export const UNIDADES_DE_COMPROMISO = {
  HORAS_TOTALES: "horas en total",
  HORAS_SEMANALES: "horas por semana",
  HORAS_MENSUALES: "horas por mes",
}

export const MODALIDADES = {
  GRATUITA: "Gratuita",
  CON_INCENTIVO_ECONOMICO: "Con incentivo económico",
  CON_POSIBILIDAD_CONTRATACION: "Con posibilidad de contratación",
}

const aHabilidades = (ids, titulosDeHabilidades) =>
  (ids ?? []).map((id) => ({ id, titulo: titulosDeHabilidades[id] }))

// Perfiles cargados antes de las validaciones actuales pueden traer campos en
// null: se muestran igual en lugar de romper la lista de proyectos.
const aPerfil = (perfilBack, titulosDeHabilidades) => ({
  id: perfilBack.id,
  nombre: perfilBack.nombre ?? "Perfil sin nombre",
  descripcion: perfilBack.descripcion,
  compromiso:
    perfilBack.cantidadHoras && perfilBack.unidadCompromiso
      ? `${perfilBack.cantidadHoras} ${UNIDADES_DE_COMPROMISO[perfilBack.unidadCompromiso]}`
      : "Sin especificar",
  cantidadHoras: perfilBack.cantidadHoras ?? null,
  unidadCompromiso: perfilBack.unidadCompromiso ?? null,
  modalidades: (perfilBack.modalidadesColaboracion ?? []).map(
    (m) => MODALIDADES[m],
  ),
  modalidadesColaboracion: perfilBack.modalidadesColaboracion ?? [],
  habilidadesRequeridas: aHabilidades(
    perfilBack.habilidadesRequeridas,
    titulosDeHabilidades,
  ),
  habilidadesOpcionales: aHabilidades(
    perfilBack.habilidadesOpcionales,
    titulosDeHabilidades,
  ),
  postulacionesAceptadas: perfilBack.postulacionesAceptadas ?? [],
  limiteColaboraciones: perfilBack.limiteColaboraciones,
  busquedaAbierta: perfilBack.busquedaAbierta !== false,
  busquedaAbiertaHasta: perfilBack.busquedaAbiertaHasta
    ? new Date(perfilBack.busquedaAbiertaHasta)
    : null,
})

// Los hitos (logros) van del más viejo al más nuevo. El avance del proyecto es
// el porcentaje del hito más reciente, igual que en el dominio del backend
// (Proyecto.getPorcentajeConcrecionActual).
const aHitos = (hitosBack = []) =>
  hitosBack
    .map((hito) => ({
      id: hito.id,
      descripcion: hito.descripcion,
      fecha: new Date(hito.fecha),
      porcentaje: hito.porcentajeConcrecion,
    }))
    .sort((a, b) => a.fecha - b.fecha)

const aProyecto = (proyectoBack, colectivo, titulosDeHabilidades) => {
  const hitos = aHitos(proyectoBack.hitos ?? [])

  return {
    id: proyectoBack.id,
    titulo: proyectoBack.titulo,
    descripcion: proyectoBack.descripcion,
    estado: proyectoBack.estado,
    colectivo,
    perfiles: (proyectoBack.perfiles ?? []).map((perfil) =>
      aPerfil(perfil, titulosDeHabilidades),
    ),
    hitos,
    avance: hitos.at(-1)?.porcentaje ?? 0,
    enlaceSistema: proyectoBack.enlaceSistemaEnFuncionamiento ?? null,
    enlaceRepositorio: proyectoBack.enlaceCodigoFuente ?? null,
  }
}

const obtenerTitulosDeHabilidades = async () => {
  const habilidades = await obtenerHabilidades()
  return Object.fromEntries(habilidades.map((h) => [h.id, h.titulo]))
}

const obtenerNombresDeColectivos = async () => {
  const response = await api.get("/colectivos")
  return Object.fromEntries(response.data.map((c) => [c.id, c.nombre]))
}

// El backend devuelve los proyectos de a páginas: { metadata: { page, limit,
// total }, data }. Se devuelven los de la página pedida y cuántas páginas hay.
export const buscarProyectos = async ({ habilidades, pagina = 1 } = {}) => {
  const [response, nombresDeColectivos, titulosDeHabilidades] =
    await Promise.all([
      api.get("/proyectos", { params: { habilidades, page: pagina } }),
      obtenerNombresDeColectivos(),
      obtenerTitulosDeHabilidades(),
    ])
  const { metadata, data } = response.data

  return {
    proyectos: data.map((proyecto) =>
      aProyecto(
        proyecto,
        {
          id: proyecto.colectivo,
          nombre: nombresDeColectivos[proyecto.colectivo],
        },
        titulosDeHabilidades,
      ),
    ),
    pagina: metadata.page,
    totalPaginas: Math.max(
      1,
      Math.ceil(metadata.total / (metadata.limit || 1)),
    ),
  }
}

export const obtenerProyecto = async (id) => {
  const [response, titulosDeHabilidades] = await Promise.all([
    api.get(`/proyectos/${id}`),
    obtenerTitulosDeHabilidades(),
  ])
  const colectivo = await api.get(`/colectivos/${response.data.colectivo}`)

  return aProyecto(
    response.data,
    { id: colectivo.data.id, nombre: colectivo.data.nombre },
    titulosDeHabilidades,
  )
}

// Cómo se llama en el back cada dato del proyecto que se carga en el front.
const CAMPO_DEL_BACK = {
  titulo: "titulo",
  descripcion: "descripcion",
  enlaceSistema: "enlaceSistemaEnFuncionamiento",
  enlaceRepositorio: "enlaceCodigoFuente",
}

const aProyectoBack = (datos) =>
  Object.fromEntries(
    Object.entries(datos).map(([campo, valor]) => [
      CAMPO_DEL_BACK[campo],
      valor,
    ]),
  )

// `datos` es { titulo, descripcion, enlaceSistema, enlaceRepositorio }, con
// los enlaces en null si no hay. Un enlace sin valor no viaja: al crear, el
// back no acepta null. Devuelve el id del proyecto creado.
export const crearProyecto = async (colectivoId, datos) => {
  const conValor = Object.fromEntries(
    Object.entries(datos).filter(([, valor]) => valor !== null),
  )
  const response = await api.post("/proyectos", {
    ...aProyectoBack(conValor),
    colectivo: colectivoId,
    estado: "PUBLICADO",
    fechaCierre: null,
  })

  return response.data.id
}

// `cambios` lleva solo los datos que se modifican, con los nombres del front.
// Un enlace en null es un enlace que se quita.
export const modificarProyecto = async (id, cambios) => {
  await api.patch(`/proyectos/${id}`, aProyectoBack(cambios))
}

export const cerrarProyecto = async (id) => {
  await api.patch(`/proyectos/${id}`, { estado: "CERRADO" })
}

export const eliminarProyecto = async (id) => {
  await api.delete(`/proyectos/${id}`)
}

// `perfil` lleva todos los datos del perfil, con la forma que espera el back.
export const agregarPerfil = async (proyectoId, perfil) => {
  await api.post(`/proyectos/${proyectoId}/perfiles`, perfil)
}

// `cambios` lleva solo los campos del perfil que se modifican, con la forma
// que espera el back.
export const modificarPerfil = async (proyectoId, perfilId, cambios) => {
  await api.patch(`/proyectos/${proyectoId}/perfiles/${perfilId}`, cambios)
}

export const eliminarPerfil = async (proyectoId, perfilId) => {
  await api.delete(`/proyectos/${proyectoId}/perfiles/${perfilId}`)
}

// Lo que necesitan las pantallas de un perfil (migas y cupos), con un único
// pedido al back. `limite` en null es un perfil sin límite; `perfil` es null
// si el perfil no es de este proyecto.
export const obtenerResumenDelPerfil = async (proyectoId, perfilId) => {
  const response = await api.get(`/proyectos/${proyectoId}`)
  const perfil = (response.data.perfiles ?? []).find(
    (perfil) => perfil.id === perfilId,
  )

  return {
    proyecto: { id: response.data.id, titulo: response.data.titulo },
    perfil: perfil
      ? {
          nombre: perfil.nombre,
          limite: perfil.limiteColaboraciones ?? null,
          aceptadas: perfil.postulacionesAceptadas?.length ?? 0,
        }
      : null,
  }
}
