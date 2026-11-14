import Mensaje from "./Mensaje"
import "./ListaDeMensajes.css"

const ListaDeMensajes = ({ mensajes, textoVacio }) => {
  if (mensajes.length === 0) {
    return <p className="lista-de-mensajes-vacia">{textoVacio}</p>
  }

  return (
    <ul className="lista-de-mensajes">
      {mensajes.map((mensaje) => (
        <li key={mensaje.id}>
          <Mensaje mensaje={mensaje} />
        </li>
      ))}
    </ul>
  )
}

export default ListaDeMensajes
