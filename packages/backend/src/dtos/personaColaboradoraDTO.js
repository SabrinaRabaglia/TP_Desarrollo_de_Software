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
  createdAt: persona.createdAt,
  updatedAt: persona.updatedAt,
})
