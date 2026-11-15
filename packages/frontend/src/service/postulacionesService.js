import api from "./api.js"

export const ESTADOS_DE_POSTULACION = {
  PENDIENTE: "Pendiente",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
  BAJA: "Baja",
}

const aProyecto = (proyectoBack) =>
  proyectoBack
    ? {
        id: proyectoBack.id,
        titulo: proyectoBack.titulo,
      }
    : null

const aPerfil = (perfilBack) =>
  perfilBack
    ? {
        id: perfilBack.id,
        nombre: perfilBack.nombre,
      }
    : null

const aColaboradora = (personaBack) => ({
  id: personaBack.id,
  nombreFantasia: personaBack.nombreFantasia,
  nombreCompleto:
    [personaBack.nombre, personaBack.apellido].filter(Boolean).join(" ") ||
    null,
  pronombres: personaBack.pronombres ?? [],
  presentacion: personaBack.presentacion ?? null,
  habilidades: personaBack.habilidades.map((habilidad) => habilidad.titulo),
  cuentas: personaBack.cuentas.map((cuenta) => ({
    tipo: cuenta.tipo,
    usuario: cuenta.nombreUsuario,
  })),
  mediosDeContacto: personaBack.mediosDeContacto.map((medio) => ({
    tipo: medio.tipo,
    valor: medio.valor,
  })),
})

const aPostulacionColaborador = (postulacionBack) => ({
  id: postulacionBack._id,
  proyecto: postulacionBack.proyecto
    ? aProyecto(postulacionBack.proyecto)
    : null,
  perfil: postulacionBack.perfil ? aPerfil(postulacionBack.perfil) : null,
  estado: postulacionBack.estado,
  fechaPostulacion: postulacionBack.fechaPostulacion,
  fechaRevision: postulacionBack.fechaRevision,
  fechaBaja: postulacionBack.fechaBaja ?? null,
  origenBaja: postulacionBack.origenBaja ?? null,
  esAnonima: postulacionBack.esAnonima,
})

const aPostulacionColectivo = (postulacionBack) => ({
  id: postulacionBack._id,
  proyecto: postulacionBack.proyecto
    ? aProyecto(postulacionBack.proyecto)
    : null,
  perfil: postulacionBack.perfil ? aPerfil(postulacionBack.perfil) : null,
  personaColaboradora: postulacionBack.personaColaboradora
    ? aColaboradora(postulacionBack.personaColaboradora)
    : null,
  estado: postulacionBack.estado,
  fechaPostulacion: postulacionBack.fechaPostulacion,
  fechaRevision: postulacionBack.fechaRevision,
  fechaBaja: postulacionBack.fechaBaja ?? null,
  origenBaja: postulacionBack.origenBaja ?? null,
  esAnonima: postulacionBack.esAnonima,
})

export const obtenerPostulacionesColaborador = async () => {
  const response = await api.get("/postulaciones")
  return response.data.map((postulacion) =>
    aPostulacionColaborador(postulacion),
  )
}

export const obtenerPostulacionesPerfil = async (id, perfilId) => {
  const response = await api.get(
    `/proyectos/${id}/perfiles/${perfilId}/postulaciones`,
  )
  return response.data.map((postulacion) => aPostulacionColectivo(postulacion))
}

export const crearPostulacion = async (proyectoId, perfilId, esAnonima) => {
  const response = await api.post(
    `proyectos/${proyectoId}/perfiles/${perfilId}/postulaciones`,
    { esAnonima },
  )
  return response.data
}

export const aceptarPostulacion = async (postulacionId) => {
  const response = await api.patch(`/postulaciones/${postulacionId}/aceptar`)
  return response.data
}

export const rechazarPostulacion = async (postulacionId) => {
  const response = await api.patch(`/postulaciones/${postulacionId}/rechazar`)
  return response.data
}

// La baja es permanente: la persona deja de colaborar en el perfil y no puede
// volver a postularse. La da la propia persona o el colectivo del proyecto.
// El back devuelve la postulación sin el proyecto ni el perfil, así que se
// devuelve solo lo que cambia, para actualizarla en la lista.
export const darDeBajaPostulacion = async (postulacionId) => {
  const response = await api.patch(`/postulaciones/${postulacionId}/baja`)
  return {
    id: response.data.id,
    estado: response.data.estado,
    fechaBaja: response.data.fechaBaja,
    origenBaja: response.data.origenBaja,
  }
}
