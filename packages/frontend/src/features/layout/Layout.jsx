import { Outlet } from "react-router-dom"
import Navbar from "../../components/navbar/Navbar"
import "./Layout.css"

const Layout = () => {
  return (
    <div className="layout">
      <Navbar />
      <main className="layout-contenido">
        <Outlet />
      </main>
      <footer className="layout-pie">
        Código a Voluntad · Desarrollo de Software · UTN FRBA
      </footer>
    </div>
  )
}

export default Layout
