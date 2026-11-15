import { Chip } from "@mui/material"
import "./ListaDeHabilidades.css"

// Las opcionales van con borde y sin relleno, para que se distingan de un
// vistazo de las que el perfil pide sí o sí.
const ListaDeHabilidades = ({ habilidades, opcionales = false }) => {
  return (
    <ul className="lista-de-habilidades">
      {habilidades.map((habilidad) => (
        <li key={habilidad}>
          <Chip
            size="small"
            label={habilidad}
            variant={opcionales ? "outlined" : "suave"}
            className={opcionales ? "lista-de-habilidades-opcional" : undefined}
          />
        </li>
      ))}
    </ul>
  )
}

export default ListaDeHabilidades
