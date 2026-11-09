import { Link } from "react-router-dom"
import { FaHandsHelping } from "react-icons/fa"
import "./Navbar.css"

const Navbar = () => {
  return (
    <header className="navbar">
      <nav className="navbar-contenido">
        <Link to="/" className="navbar-marca">
          <FaHandsHelping aria-hidden="true" />
          Código a Voluntad
        </Link>
      </nav>
    </header>
  )
}

export default Navbar
