const origen = (proyecto, perfil) => {
  if (proyecto && perfil) {
    return `por el perfil ${perfil} de "${proyecto}"`
  }
  if (proyecto) {
    return `por el proyecto "${proyecto}"`
  }
  return "en Código a Voluntad"
}

export const redactarAvisoExterno = ({
  colectivo,
  proyecto,
  perfil,
  contenido,
  urlDeLaPlataforma,
}) => {
  const encabezado = `${colectivo ?? "Un colectivo"} te escribió ${origen(proyecto, perfil)}:`
  const comoResponder = urlDeLaPlataforma
    ? `entrá a la plataforma: ${urlDeLaPlataforma}/mensajes`
    : "entrá a la plataforma."
  return [
    encabezado,
    contenido,
    `Este es un aviso automático de Código a Voluntad. Para responder ${comoResponder}`,
  ].join("\n\n")
}
