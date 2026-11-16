import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { obtenerUsuarioActual, ROLES } from "../../service/authService"
import { mensajeDeError } from "../../service/api"
import "./MiCuenta.css"

const ENLACES_POR_ROL = {
  PERSONA_COLABORADORA: (id) => [
    { a: `/colaboradoras/${id}`, texto: "Ver mi perfil público" },
    { a: "/mi-perfil", texto: "Editar mi perfil" },
  ],
  COLECTIVO: (id) => [
    { a: `/colectivos/${id}`, texto: "Ver la página de mi colectivo" },
    { a: "/mi-colectivo", texto: "Editar mi colectivo" },
  ],
}

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
      {usuario.entidad && (
        <p className="mi-cuenta-enlaces">
          {ENLACES_POR_ROL[usuario.rol](usuario.entidad.id).map(
            ({ a, texto }) => (
              <Link key={a} to={a}>
                {texto}
              </Link>
            ),
          )}
        </p>
      )}
    </section>
  )
}

export default MiCuenta
