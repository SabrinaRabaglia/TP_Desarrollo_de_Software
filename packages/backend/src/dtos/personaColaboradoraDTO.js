export const personaColaboradoraDTO = (persona) => ({
  id: persona.id,
  nombreFantasia: persona.nombreFantasia,
  nombre: persona.nombre,
  apellido: persona.apellido,
  pronombres: persona.pronombres,
  presentacion: persona.presentacion,
  cuentas: persona.cuentas,
  habilidades: persona.habilidades,
  aceptaMensajeriaInterna: persona.aceptaMensajeriaInterna,
  mediosDeContacto: persona.mediosDeContacto.map((medio) => ({
    id: String(medio.id ?? medio._id),
    tipo: medio.tipo,
  })),
  createdAt: persona.createdAt,
  updatedAt: persona.updatedAt,
})
