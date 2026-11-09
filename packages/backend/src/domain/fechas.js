export const inicioDelDiaSiguiente = (fecha) => {
  const limite = new Date(fecha)
  limite.setUTCHours(24, 0, 0, 0)
  return limite
}
