export const notificacionDTO = (notificacion) => ({
  id: notificacion.id,
  fecha: notificacion.fecha,
  contenido: notificacion.contenido,
  colectivo: notificacion.colectivo,
  personaColaboradora: notificacion.personaColaboradora,
  perfil: notificacion.perfil,
  mediosExternosUtilizados: notificacion.mediosExternosUtilizados.map(
    (medio) => medio.tipo,
  ),
  createdAt: notificacion.createdAt,
  updatedAt: notificacion.updatedAt,
})
