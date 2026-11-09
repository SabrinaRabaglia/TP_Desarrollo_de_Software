import { CircularProgress } from "@mui/material"
import "./Cargando.css"

const Cargando = ({ texto = "Cargando..." }) => {
  return (
    <div className="cargando" role="status">
      <CircularProgress aria-hidden="true" />
      <p>{texto}</p>
    </div>
  )
}

export default Cargando
