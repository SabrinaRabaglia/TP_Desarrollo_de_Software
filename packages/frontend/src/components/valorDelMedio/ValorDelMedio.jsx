// Cómo se muestra el valor de un medio de contacto. Telegram no es una forma de
// escribirle a la persona: el back guarda el id del chat del bot, que solo
// sirve para que la plataforma le avise.
const ValorDelMedio = ({ medio }) => {
  if (medio.tipo === "TELEGRAM") {
    return "Solo para avisos de la plataforma"
  }
  if (medio.tipo === "EMAIL") {
    return <a href={`mailto:${medio.valor}`}>{medio.valor}</a>
  }
  return medio.valor
}

export default ValorDelMedio
