import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { obtenerUsuarioActual, ROLES } from "../../service/authService"
import { mensajeDeError } from "../../service/api"
import "./MiCuenta.css"

const MiCuenta = () => {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        setUsuario(await obtenerUsuarioActual())
      } catch (e) {
        setError(mensajeDeError(e))
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [intento])

  if (cargando) {
    return <Cargando texto="Cargando tu cuenta..." />
  }

  if (error) {
    return (
      <MensajeDeError
        mensaje={error}
        alReintentar={() => setIntento(intento + 1)}
      />
    )
  }

  return (
    <section className="mi-cuenta">
      <h1>Mi cuenta</h1>
      <dl className="mi-cuenta-datos">
        <dt>Nombre</dt>
        <dd>{usuario.nombre}</dd>
        <dt>Email</dt>
        <dd>{usuario.email}</dd>
        <dt>Rol</dt>
        <dd>{ROLES[usuario.rol]}</dd>
      </dl>
      {usuario.rol === "PERSONA_COLABORADORA" && usuario.entidad && (
        <p className="mi-cuenta-enlaces">
          <Link to={`/colaboradoras/${usuario.entidad.id}`}>
            Ver mi perfil público
          </Link>
          <Link to="/mi-perfil">Editar mi perfil</Link>
        </p>
      )}
    </section>
  )
}

export default MiCuenta
