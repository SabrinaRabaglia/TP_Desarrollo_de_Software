import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const RutaPrivada = ({ rol }) => {
  const { usuario } = useAuth()
  const location = useLocation()

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: location }} />
  }

  if (rol && usuario.rol !== rol) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default RutaPrivada
