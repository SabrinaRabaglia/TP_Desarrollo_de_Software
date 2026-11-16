import api from "./api"

// El back devuelve en null el colectivo, el proyecto o el perfil que ya no
// existen; el mensaje se muestra igual, con un texto en su lugar.
export const aMensaje = (mensajeBack) => ({
  id: mensajeBack.id,
  fecha: new Date(mensajeBack.fecha),
  contenido: mensajeBack.contenido,
  colectivo: mensajeBack.colectivo?.nombre ?? "Colectivo eliminado",
  // Solo viene en los enviados: es la persona a la que se le escribió.
  destinataria: mensajeBack.personaColaboradora?.nombreFantasia ?? null,
  proyecto: mensajeBack.proyecto
    ? { id: mensajeBack.proyecto.id, titulo: mensajeBack.proyecto.titulo }
    : { id: null, titulo: "Proyecto eliminado" },
  perfil: mensajeBack.perfil
    ? (mensajeBack.perfil.nombre ?? "Perfil sin nombre")
    : "Perfil eliminado",
  // Solo viene en los recibidos: en los enviados no se sabe si se leyó.
  noLeido: mensajeBack.leida === false,
})

export const obtenerRecibidos = async (personaId) => {
  const response = await api.get(
    `/personas-colaboradoras/${personaId}/notificaciones`,
  )
  return response.data.map(aMensaje)
}

export const contarRecibidosSinLeer = async (personaId) => {
  const response = await api.get(
    `/personas-colaboradoras/${personaId}/notificaciones/sin-leer`,
  )
  return response.data.cantidad
}

// Marca todos los recibidos como leídos y devuelve cuántos estaban sin leer.
export const marcarRecibidosComoLeidos = async (personaId) => {
  const response = await api.patch(
    `/personas-colaboradoras/${personaId}/notificaciones`,
    { leida: true },
  )
  return response.data.marcadas
}

export const obtenerEnviados = async (colectivoId) => {
  const response = await api.get(`/colectivos/${colectivoId}/notificaciones`)
  return response.data.map(aMensaje)
}

export const enviarMensaje = async ({
  proyectoId,
  perfilId,
  personaId,
  contenido,
}) => {
  await api.post(
    `/proyectos/${proyectoId}/perfiles/${perfilId}/notificaciones`,
    { personaColaboradora: personaId, contenido },
  )
}
