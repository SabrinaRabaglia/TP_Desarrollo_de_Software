import { Outlet } from "react-router-dom"
import Navbar from "../../components/navbar/Navbar"
import "./Layout.css"

const Layout = () => {
  return (
    <div className="layout">
      <a className="saltar-contenido" href="#contenido">
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido" className="layout-contenido" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="layout-pie">
        Código a Voluntad · Desarrollo de Software · UTN FRBA
      </footer>
    </div>
  )
}

export default Layout
