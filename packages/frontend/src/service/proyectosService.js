import api from "./api"
import { obtenerHabilidades } from "./habilidadesService"

export const ESTADOS_DE_PROYECTO = {
  PUBLICADO: "Publicado",
  CERRADO: "Cerrado",
}

const UNIDADES_DE_COMPROMISO = {
  HORAS_TOTALES: "horas en total",
  HORAS_SEMANALES: "horas por semana",
  HORAS_MENSUALES: "horas por mes",
}

const MODALIDADES = {
  GRATUITA: "Gratuita",
  CON_INCENTIVO_ECONOMICO: "Con incentivo económico",
  CON_POSIBILIDAD_CONTRATACION: "Con posibilidad de contratación",
}

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
  modalidades: (perfilBack.modalidadesColaboracion ?? []).map(
    (m) => MODALIDADES[m],
  ),
  habilidadesRequeridas: (perfilBack.habilidadesRequeridas ?? []).map(
    (id) => titulosDeHabilidades[id],
  ),
  habilidadesOpcionales: (perfilBack.habilidadesOpcionales ?? []).map(
    (id) => titulosDeHabilidades[id],
  ),
  postulacionesAceptadas: perfilBack.postulacionesAceptadas ?? [],
  limiteColaboraciones: perfilBack.limiteColaboraciones,
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

// Para las migas de pan: solo los nombres, con un único pedido al back.
export const obtenerNombresDelPerfil = async (proyectoId, perfilId) => {
  const response = await api.get(`/proyectos/${proyectoId}`)
  const perfil = (response.data.perfiles ?? []).find(
    (perfil) => perfil.id === perfilId,
  )

  return { proyecto: response.data.titulo, perfil: perfil?.nombre ?? null }
}

// Para revisar postulaciones: cuántos lugares tiene el perfil y cuántos ocupa.
// `limite` en null es un perfil sin límite.
export const obtenerCuposDelPerfil = async (proyectoId, perfilId) => {
  const response = await api.get(`/proyectos/${proyectoId}`)
  const perfil = (response.data.perfiles ?? []).find(
    (perfil) => perfil.id === perfilId,
  )

  return {
    limite: perfil?.limiteColaboraciones ?? null,
    aceptadas: perfil?.postulacionesAceptadas?.length ?? 0,
  }
}
