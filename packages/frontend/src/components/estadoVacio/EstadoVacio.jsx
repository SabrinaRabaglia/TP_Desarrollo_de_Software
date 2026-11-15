import { Link } from "react-router-dom"
import { Button, Typography } from "@mui/material"
import "./EstadoVacio.css"

// Lo que se muestra cuando una lista no tiene nada. Por ejemplo:
// <EstadoVacio
//   icono={<LuInbox />}
//   titulo="Todavía no te postulaste"
//   texto="Explorá proyectos y sumate a los que te interesen."
//   accion={{ etiqueta: "Ver proyectos", a: "/" }}
// />
const EstadoVacio = ({ icono, titulo, texto, accion }) => {
  return (
    <section className="estado-vacio" aria-live="polite">
      {icono && (
        <div className="estado-vacio-icono" aria-hidden="true">
          {icono}
        </div>
      )}
      <Typography variant="h3" component="h2">
        {titulo}
      </Typography>
      {texto && (
        <Typography
          variant="body2"
          color="text.secondary"
          className="estado-vacio-texto"
        >
          {texto}
        </Typography>
      )}
      {accion && (
        <Button variant="contained" component={Link} to={accion.a}>
          {accion.etiqueta}
        </Button>
      )}
    </section>
  )
}

export default EstadoVacio
