import { Link as RouterLink } from "react-router-dom"
import { Breadcrumbs, Link, Skeleton, Typography } from "@mui/material"
import { LuChevronRight } from "react-icons/lu"
import "./Migas.css"

// Dónde está parada la persona en las pantallas de un perfil:
// Proyectos › <proyecto> › <perfil> › <actual>
// Los nombres los trae la pantalla (que ya pide el proyecto). Mientras
// `cargando`, se muestra un skeleton; si no llegaron, un nombre genérico.
// <Migas
//   proyectoId={proyectoId}
//   proyecto={resumen?.proyecto.titulo}
//   perfil={resumen?.perfil?.nombre}
//   actual="Postulaciones"
//   cargando={!resumen}
// />
const Migas = ({ proyectoId, proyecto, perfil, actual, cargando = false }) => {
  const nombre = (valor, alternativo) =>
    cargando ? (
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
        {nombre(proyecto, "Proyecto")}
      </Link>
      {/* El perfil no tiene pantalla propia: se ve dentro del proyecto */}
      <Typography component="span" color="inherit">
        {nombre(perfil, "Perfil")}
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
