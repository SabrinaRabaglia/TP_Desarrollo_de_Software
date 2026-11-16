import { Link } from "react-router-dom"
import { Chip } from "@mui/material"
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
    <article
      className={mensaje.noLeido ? "mensaje mensaje-no-leido" : "mensaje"}
    >
      <header className="mensaje-encabezado">
        <div className="mensaje-remitente">
          <h2>{titulo}</h2>
          {/* El texto del chip lo dice: no depende solo del borde de color */}
          {mensaje.noLeido && (
            <Chip size="small" variant="suave" color="info" label="Sin leer" />
          )}
        </div>
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
