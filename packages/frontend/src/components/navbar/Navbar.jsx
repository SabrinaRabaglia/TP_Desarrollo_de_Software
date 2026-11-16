import { useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import {
  AppBar,
  Avatar,
  Button,
  Divider,
  Drawer,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
} from "@mui/material"
import {
  LuBuilding2,
  LuChevronDown,
  LuCircleUser,
  LuClipboardList,
  LuFolderOpen,
  LuLogIn,
  LuLogOut,
  LuMenu,
  LuMessageSquare,
  LuSearch,
  LuUserPen,
  LuUserPlus,
  LuX,
} from "react-icons/lu"
import { useAuth } from "../../context/AuthContext"
import "./Navbar.css"

// Qué secciones ve cada quien. Las `principales` van en la barra. Las
// `deLaCuenta` van en el menú de quien tiene la sesión, junto a cerrar sesión.
// Buscar proyectos, Mis postulaciones y Mi perfil son solo de las personas
// colaboradoras. Mi colectivo lo ven solo los colectivos.
const enlacesPara = (usuario) => {
  const proyectos = { a: "/", texto: "Proyectos", Icono: LuFolderOpen }

  if (!usuario) {
    return {
      principales: [
        proyectos,
        { a: "/login", texto: "Ingresar", Icono: LuLogIn },
        { a: "/colaboradoras/nueva", texto: "Registrarme", Icono: LuUserPlus },
      ],
      deLaCuenta: [],
    }
  }

  const esColaboradora = usuario.rol === "PERSONA_COLABORADORA"

  return {
    principales: [
      proyectos,
      esColaboradora && {
        a: "/buscar",
        texto: "Buscar proyectos",
        Icono: LuSearch,
      },
      esColaboradora && {
        a: "/postulaciones",
        texto: "Mis postulaciones",
        Icono: LuClipboardList,
      },
      { a: "/mensajes", texto: "Mensajes", Icono: LuMessageSquare },
    ].filter(Boolean),
    deLaCuenta: [
      esColaboradora
        ? { a: "/mi-perfil", texto: "Mi perfil", Icono: LuUserPen }
        : {
            a: "/mi-colectivo",
            texto: "Mi colectivo",
            Icono: LuBuilding2,
          },
      { a: "/mi-cuenta", texto: "Mi cuenta", Icono: LuCircleUser },
    ],
  }
}

const iniciales = (nombre = "") =>
  nombre
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("")

// En la barra: el avatar y el nombre de quien tiene la sesión abren un menú
// con las secciones de su cuenta y cerrar sesión.
const MenuDeLaCuenta = ({ usuario, enlaces, alCerrarSesion }) => {
  const [ancla, setAncla] = useState(null)
  const abierto = Boolean(ancla)
  const cerrar = () => setAncla(null)

  return (
    <>
      <Button
        className="navbar-usuario"
        color="inherit"
        aria-label={`Cuenta de ${usuario.nombre}`}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? "navbar-menu-de-la-cuenta" : undefined}
        onClick={(evento) => setAncla(evento.currentTarget)}
      >
        <Avatar aria-hidden="true">{iniciales(usuario.nombre)}</Avatar>
        <span className="navbar-usuario-nombre">{usuario.nombre}</span>
        <LuChevronDown aria-hidden="true" />
      </Button>
      <Menu
        id="navbar-menu-de-la-cuenta"
        anchorEl={ancla}
        open={abierto}
        onClose={cerrar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {enlaces.map(({ a, texto, Icono }) => (
          <MenuItem key={a} component={NavLink} to={a} onClick={cerrar}>
            <ListItemIcon>
              <Icono aria-hidden="true" />
            </ListItemIcon>
            {texto}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => {
            cerrar()
            alCerrarSesion()
          }}
        >
          <ListItemIcon>
            <LuLogOut aria-hidden="true" />
          </ListItemIcon>
          Cerrar sesión
        </MenuItem>
      </Menu>
    </>
  )
}

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
  const { principales, deLaCuenta } = enlacesPara(usuario)

  const cerrarMenu = () => setMenuAbierto(false)

  const cerrarSesion = () => {
    cerrarMenu()
    logout()
    navigate("/")
  }

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
          <Enlaces enlaces={principales} />
        </div>

        {usuario && (
          <MenuDeLaCuenta
            usuario={usuario}
            enlaces={deLaCuenta}
            alCerrarSesion={cerrarSesion}
          />
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
            <div className="navbar-drawer-usuario">
              <Avatar aria-hidden="true">{iniciales(usuario.nombre)}</Avatar>
              <span>{usuario.nombre}</span>
            </div>
          )}
          <div className="navbar-drawer-links">
            <Enlaces
              enlaces={[...principales, ...deLaCuenta]}
              alElegir={cerrarMenu}
            />
          </div>
          {usuario && (
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<LuLogOut aria-hidden="true" />}
              onClick={cerrarSesion}
            >
              Cerrar sesión
            </Button>
          )}
        </nav>
      </Drawer>
    </AppBar>
  )
}

export default Navbar
