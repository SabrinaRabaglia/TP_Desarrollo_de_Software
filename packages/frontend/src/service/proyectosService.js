import api from "./api"

export const ESTADOS_DE_PROYECTO = {
  PUBLICADO: "Publicado",
  CERRADO: "Cerrado",
}

export const UNIDADES_DE_COMPROMISO = {
  HORAS_TOTALES: "horas en total",
  HORAS_SEMANALES: "horas por semana",
  HORAS_MENSUALES: "horas por mes",
}

export const MODALIDADES_DE_COLABORACION = {
  GRATUITA: "Gratuita",
  CON_INCENTIVO_ECONOMICO: "Con incentivo económico",
  CON_POSIBILIDAD_CONTRATACION: "Con posibilidad de contratación",
}

const aPerfil = (perfilBack, titulosDeHabilidades) => ({
  id: perfilBack.id,
  nombre: perfilBack.nombre ?? "Perfil sin nombre",
  descripcion: perfilBack.descripcion,
  compromiso: `${perfilBack.cantidadHoras} ${UNIDADES_DE_COMPROMISO[perfilBack.unidadCompromiso]}`,
  modalidades: perfilBack.modalidadesColaboracion.map(
    (m) => MODALIDADES_DE_COLABORACION[m],
  ),
  habilidadesRequeridas: perfilBack.habilidadesRequeridas.map(
    (id) => titulosDeHabilidades[id],
  ),
  habilidadesOpcionales: perfilBack.habilidadesOpcionales.map(
    (id) => titulosDeHabilidades[id],
  ),
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
  const response = await api.get("/habilidades")
  return Object.fromEntries(response.data.map((h) => [h.id, h.titulo]))
}

const obtenerNombresDeColectivos = async () => {
  const response = await api.get("/colectivos")
  return Object.fromEntries(response.data.map((c) => [c.id, c.nombre]))
}

export const buscarProyectos = async ({ habilidades } = {}) => {
  const [response, nombresDeColectivos, titulosDeHabilidades] =
    await Promise.all([
      api.get("/proyectos", { params: { habilidades } }),
      obtenerNombresDeColectivos(),
      obtenerTitulosDeHabilidades(),
    ])

  return response.data.map((proyecto) =>
    aProyecto(
      proyecto,
      {
        id: proyecto.colectivo,
        nombre: nombresDeColectivos[proyecto.colectivo],
      },
      titulosDeHabilidades,
    ),
  )
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

const idDeReferencia = (referencia) =>
  referencia && typeof referencia === "object"
    ? (referencia.id ?? referencia._id)
    : referencia

export const obtenerProyectoParaEditar = async (id) => {
  const response = await api.get(`/proyectos/${id}`)
  const proyecto = response.data

  return {
    ...proyecto,
    colectivo: idDeReferencia(proyecto.colectivo),
    perfiles: (proyecto.perfiles ?? []).map((perfil) => ({
      id: perfil.id ?? perfil._id,
      nombre: perfil.nombre ?? "",
      descripcion: perfil.descripcion,
      unidadCompromiso: perfil.unidadCompromiso,
      cantidadHoras: perfil.cantidadHoras,
      modalidadesColaboracion: perfil.modalidadesColaboracion ?? [],
      habilidadesRequeridas: (perfil.habilidadesRequeridas ?? []).map(
        idDeReferencia,
      ),
      habilidadesOpcionales: (perfil.habilidadesOpcionales ?? []).map(
        idDeReferencia,
      ),
      limiteColaboraciones: perfil.limiteColaboraciones ?? null,
    })),
  }
}

export const obtenerHabilidades = async () => {
  const response = await api.get("/habilidades")
  return response.data.map(({ id, titulo }) => ({ id, titulo }))
}

export const crearProyecto = async (nuevoProyecto) => {
  const response = await api.post("/proyectos", nuevoProyecto)
  return response.data
}

export const actualizarProyecto = async (id, proyectoActualizado) => {
  const response = await api.put(`/proyectos/${id}`, proyectoActualizado)
  return response.data
}

export const eliminarProyecto = async (id) => {
  await api.delete(`/proyectos/${id}`)
}

export const crearPerfil = async (proyectoId, nuevoPerfil) => {
  const response = await api.post(
    `/proyectos/${proyectoId}/perfiles`,
    nuevoPerfil,
  )
  return response.data
}

export const actualizarPerfil = async (proyectoId, perfilId, perfil) => {
  const response = await api.put(
    `/proyectos/${proyectoId}/perfiles/${perfilId}`,
    perfil,
  )
  return response.data
}

export const eliminarPerfil = async (proyectoId, perfilId) => {
  await api.delete(`/proyectos/${proyectoId}/perfiles/${perfilId}`)
}
