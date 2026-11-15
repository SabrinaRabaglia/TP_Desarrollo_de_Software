import { useEffect, useState } from "react"
import { Link as RouterLink } from "react-router-dom"
import { Breadcrumbs, Link, Skeleton, Typography } from "@mui/material"
import { LuChevronRight } from "react-icons/lu"
import { obtenerNombresDelPerfil } from "../../service/proyectosService"
import "./Migas.css"

// Dónde está parada la persona en las pantallas de un perfil:
// Proyectos › <proyecto> › <perfil> › <actual>
// <Migas proyectoId={proyectoId} perfilId={perfilId} actual="Postulaciones" />
const Migas = ({ proyectoId, perfilId, actual }) => {
  const [nombres, setNombres] = useState(null)

  useEffect(() => {
    let vigente = true
    setNombres(null)

    obtenerNombresDelPerfil(proyectoId, perfilId)
      .then((cargados) => vigente && setNombres(cargados ?? {}))
      // Si no llegan los nombres, las migas siguen sirviendo para volver.
      .catch(() => vigente && setNombres({}))

    return () => {
      vigente = false
    }
  }, [proyectoId, perfilId])

  const nombre = (valor, alternativo) =>
    nombres === null ? (
      <Skeleton
        variant="text"
        width="8ch"
        className="migas-cargando"
        aria-label="Cargando"
      />
    ) : (
      valor || alternativo
    )

  return (
    <Breadcrumbs
      className="migas"
      aria-label="Ubicación"
      separator={<LuChevronRight aria-hidden="true" />}
    >
      <Link component={RouterLink} to="/" underline="hover" color="inherit">
        Proyectos
      </Link>
      <Link
        component={RouterLink}
        to={`/proyectos/${proyectoId}`}
        underline="hover"
        color="inherit"
      >
        {nombre(nombres?.proyecto, "Proyecto")}
      </Link>
      {/* El perfil no tiene pantalla propia: se ve dentro del proyecto */}
      <Typography component="span" color="inherit">
        {nombre(nombres?.perfil, "Perfil")}
      </Typography>
      <Typography
        component="span"
        color="text.primary"
        aria-current="page"
        className="migas-actual"
      >
        {actual}
      </Typography>
    </Breadcrumbs>
  )
}

export default Migas
