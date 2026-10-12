export const colaboracionDTO = (colaboracion) => ({
  id: colaboracion.id,
  fechaInscripcion: colaboracion.fechaInscripcion,
  esAnonima: colaboracion.esAnonima,
  personaColaboradora: colaboracion.esAnonima
    ? null
    : colaboracion.personaColaboradora,
  proyecto: colaboracion.proyecto,
  createdAt: colaboracion.createdAt,
  updatedAt: colaboracion.updatedAt,
})
