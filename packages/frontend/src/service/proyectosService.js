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

const aProyecto = (proyectoBack, colectivo, titulosDeHabilidades) => ({
  id: proyectoBack.id,
  titulo: proyectoBack.titulo,
  descripcion: proyectoBack.descripcion,
  estado: proyectoBack.estado,
  colectivo,
  perfiles: (proyectoBack.perfiles ?? []).map((perfil) =>
    aPerfil(perfil, titulosDeHabilidades),
  ),
})

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
