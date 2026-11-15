import { useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import {
  AppBar,
  Avatar,
  Button,
  Drawer,
  IconButton,
  Toolbar,
} from "@mui/material"
import {
  LuCircleUser,
  LuClipboardList,
  LuFolderOpen,
  LuLogIn,
  LuLogOut,
  LuMenu,
  LuMessageSquare,
  LuUserPen,
  LuUserPlus,
  LuX,
} from "react-icons/lu"
import { useAuth } from "../../context/AuthContext"
import "./Navbar.css"

// Qué secciones ve cada quien. Mis postulaciones y Mi perfil son solo de las
// personas colaboradoras; Mensajes y Mi cuenta, de cualquiera con sesión.
const enlacesPara = (usuario) => {
  const proyectos = { a: "/", texto: "Proyectos", Icono: LuFolderOpen }

  if (!usuario) {
    return [
      proyectos,
      { a: "/login", texto: "Ingresar", Icono: LuLogIn },
      { a: "/colaboradoras/nueva", texto: "Registrarme", Icono: LuUserPlus },
    ]
  }

  const esColaboradora = usuario.rol === "PERSONA_COLABORADORA"

  return [
    proyectos,
    esColaboradora && {
      a: "/postulaciones",
      texto: "Mis postulaciones",
      Icono: LuClipboardList,
    },
    { a: "/mensajes", texto: "Mensajes", Icono: LuMessageSquare },
    esColaboradora && { a: "/mi-perfil", texto: "Mi perfil", Icono: LuUserPen },
    { a: "/mi-cuenta", texto: "Mi cuenta", Icono: LuCircleUser },
  ].filter(Boolean)
}

const iniciales = (nombre = "") =>
  nombre
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("")

const Enlaces = ({ enlaces, alElegir }) =>
  enlaces.map(({ a, texto, Icono }) => (
    <NavLink
      key={a}
      to={a}
      end={a === "/"}
      className="navbar-link"
      onClick={alElegir}
    >
      <Icono aria-hidden="true" />
      {texto}
    </NavLink>
  ))

const Navbar = () => {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const enlaces = enlacesPara(usuario)

  const cerrarMenu = () => setMenuAbierto(false)

  const cerrarSesion = () => {
    cerrarMenu()
    logout()
    navigate("/")
  }

  const botonCerrarSesion = (
    <Button
      variant="outlined"
      color="inherit"
      size="small"
      startIcon={<LuLogOut aria-hidden="true" />}
      onClick={cerrarSesion}
    >
      Cerrar sesión
    </Button>
  )

  return (
    <AppBar component="header">
      <Toolbar
        component="nav"
        aria-label="Principal"
        className="navbar contenedor"
        disableGutters
      >
        <IconButton
          className="navbar-menu"
          aria-label="Abrir menú"
          edge="start"
          onClick={() => setMenuAbierto(true)}
        >
          <LuMenu aria-hidden="true" />
        </IconButton>

        <Link to="/" className="navbar-logo" aria-label="Código a Voluntad">
          <span className="navbar-logo-marca" aria-hidden="true">
            CV
          </span>
          <span className="navbar-logo-texto" aria-hidden="true">
            Código a Voluntad
          </span>
        </Link>

        <div className="navbar-links">
          <Enlaces enlaces={enlaces} />
        </div>

        {usuario && (
          <div className="navbar-usuario">
            <Avatar aria-hidden="true">{iniciales(usuario.nombre)}</Avatar>
            <span className="navbar-usuario-nombre">{usuario.nombre}</span>
            <span className="navbar-cerrar-sesion">{botonCerrarSesion}</span>
          </div>
        )}
      </Toolbar>

      <Drawer open={menuAbierto} onClose={cerrarMenu}>
        <nav className="navbar-drawer" aria-label="Menú">
          <IconButton
            className="navbar-drawer-cerrar"
            aria-label="Cerrar menú"
            onClick={cerrarMenu}
          >
            <LuX aria-hidden="true" />
          </IconButton>
          {usuario && (
            <p className="navbar-drawer-usuario">
              <Avatar aria-hidden="true">{iniciales(usuario.nombre)}</Avatar>
              {usuario.nombre}
            </p>
          )}
          <div className="navbar-drawer-links">
            <Enlaces enlaces={enlaces} alElegir={cerrarMenu} />
          </div>
          {usuario && botonCerrarSesion}
        </nav>
      </Drawer>
    </AppBar>
  )
}

export default Navbar
