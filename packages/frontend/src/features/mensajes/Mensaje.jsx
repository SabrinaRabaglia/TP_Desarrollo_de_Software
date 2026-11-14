import { Link } from "react-router-dom"
import "./Mensaje.css"

const formatoDeFecha = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
})

const Mensaje = ({ mensaje }) => {
  // En los enviados se muestra a quién se le escribió; en los recibidos, quién escribió.
  const titulo = mensaje.destinataria
    ? `Para ${mensaje.destinataria}`
    : `De ${mensaje.colectivo}`

  return (
    <article className="mensaje">
      <header className="mensaje-encabezado">
        <h2>{titulo}</h2>
        <time dateTime={mensaje.fecha.toISOString()}>
          {formatoDeFecha.format(mensaje.fecha)}
        </time>
      </header>
      <dl className="mensaje-datos">
        <dt>Proyecto</dt>
        <dd>
          {mensaje.proyecto.id ? (
            <Link to={`/proyectos/${mensaje.proyecto.id}`}>
              {mensaje.proyecto.titulo}
            </Link>
          ) : (
            mensaje.proyecto.titulo
          )}
        </dd>
        <dt>Perfil</dt>
        <dd>{mensaje.perfil}</dd>
      </dl>
      <p className="mensaje-contenido">{mensaje.contenido}</p>
    </article>
  )
}

export default Mensaje
