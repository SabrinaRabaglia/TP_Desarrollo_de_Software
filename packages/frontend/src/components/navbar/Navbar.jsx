import { Link, useNavigate } from "react-router-dom"
import { Button } from "@mui/material"
import {
  FaHandsHelping,
  FaSignInAlt,
  FaSignOutAlt,
  FaUserCircle,
  FaUserEdit,
  FaUserPlus,
} from "react-icons/fa"
import { useAuth } from "../../context/AuthContext"
import "./Navbar.css"

const Navbar = () => {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const cerrarSesion = () => {
    logout()
    navigate("/")
  }

  return (
    <header className="navbar">
      <nav className="navbar-contenido">
        <Link to="/" className="navbar-marca">
          <FaHandsHelping aria-hidden="true" />
          Código a Voluntad
        </Link>

        {usuario ? (
          <div className="navbar-acciones">
            <Link to="/mi-cuenta" className="navbar-link">
              <FaUserCircle aria-hidden="true" />
              Mi cuenta
            </Link>
            {usuario.rol === "PERSONA_COLABORADORA" && (
              <Link to="/mi-perfil" className="navbar-link">
                <FaUserEdit aria-hidden="true" />
                Mi perfil
              </Link>
            )}
            <span className="navbar-usuario">{usuario.nombre}</span>
            <Button
              color="inherit"
              size="small"
              startIcon={<FaSignOutAlt aria-hidden="true" />}
              onClick={cerrarSesion}
            >
              Cerrar sesión
            </Button>
          </div>
        ) : (
          <div className="navbar-acciones">
            <Link to="/login" className="navbar-link">
              <FaSignInAlt aria-hidden="true" />
              Ingresar
            </Link>
            <Link to="/colaboradoras/nueva" className="navbar-link">
              <FaUserPlus aria-hidden="true" />
              Registrarme
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar
