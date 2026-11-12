import api from "./api.js";

export const ESTADOS_DE_POSTULACION = {
  PENDIENTE: "Pendiente",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
  BAJA: "Baja",
}

const aProyecto = (proyectoBack) =>
  proyectoBack
    ? { titulo: proyectoBack.titulo }
    : null

const aPerfil = (perfilBack) =>
  perfilBack
    ? { nombre: perfilBack.nombre }
    : null

const aPostulacion = (postulacionBack) => ({
  proyecto: aProyecto(postulacionBack.proyecto),
  perfil: aPerfil(postulacionBack.perfil),
  estado: postulacionBack.estado,
})

export const obtenerPostulacionesColaborador = async () => {
  const response = await api.get("/postulaciones")
  return response.data.map((postulacion) => aPostulacion(postulacion))
}

export const obtenerPostulacionesPerfil = async (proyectoId, perfilId) => {
  const response = await api.get(`proyectos/${proyectoId}/perfiles/${perfilId}/postulaciones`)
  return response.data.map((postulacion) => aPostulacion(postulacion))
}

export const crearPostulacion = async (proyectoId, perfilId, esAnonima) => {
  const response = await api.post(
    `proyectos/${proyectoId}/perfiles/${perfilId}/postulaciones`,
    { esAnonima },
  )
  return response.data
}