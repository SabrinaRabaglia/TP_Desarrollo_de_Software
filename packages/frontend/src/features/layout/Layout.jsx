import { Outlet } from "react-router-dom"
import Navbar from "../../components/navbar/Navbar"
import { ProveedorDeMensajesSinLeer } from "../../context/MensajesSinLeerContext"
import "./Layout.css"

const Layout = () => {
  return (
    // El contador de mensajes sin leer lo comparten la navbar y la página.
    <ProveedorDeMensajesSinLeer>
      <div className="layout">
        <a className="saltar-contenido" href="#contenido">
          Saltar al contenido
        </a>
        <Navbar />
        <main
          id="contenido"
          className="layout-contenido contenedor"
          tabIndex={-1}
        >
          <Outlet />
        </main>
        <footer className="layout-pie">
          <div className="layout-pie-contenido contenedor">
            <span className="layout-pie-marca">Código a Voluntad</span>
            <span>Desarrollo de Software · UTN FRBA</span>
          </div>
        </footer>
      </div>
    </ProveedorDeMensajesSinLeer>
  )
}

export default Layout
