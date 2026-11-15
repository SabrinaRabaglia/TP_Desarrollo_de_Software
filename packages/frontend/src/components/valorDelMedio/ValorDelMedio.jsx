// Cómo se muestra el valor de un medio de contacto. Telegram no tiene un dato
// para mostrar: el back guarda el id del chat del bot, así que solo se dice
// que está conectado.
const ValorDelMedio = ({ medio }) => {
  if (medio.tipo === "TELEGRAM") {
    return "Conectado"
  }
  if (medio.tipo === "EMAIL") {
    return <a href={`mailto:${medio.valor}`}>{medio.valor}</a>
  }
  return medio.valor
}

export default ValorDelMedio
