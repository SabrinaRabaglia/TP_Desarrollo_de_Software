import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { useAuth } from "../../context/AuthContext"
import { mensajeDeError } from "../../service/api"
import {
  actualizarColaboradora,
  obtenerPerfilPropio,
} from "../../service/colaboradorasService"
import { obtenerHabilidades } from "../../service/habilidadesService"
import FormularioColaboradora from "./FormularioColaboradora"
import "./MiPerfil.css"

const MiPerfil = () => {
  const { usuario, refrescarUsuario } = useAuth()
  const id = usuario.entidad.id

  const [habilidades, setHabilidades] = useState([])
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorDeCarga, setErrorDeCarga] = useState(null)
  const [intento, setIntento] = useState(0)

  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [guardados, setGuardados] = useState(0)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setErrorDeCarga(null)
      try {
        const [catalogo, perfilGuardado] = await Promise.all([
          obtenerHabilidades(),
          obtenerPerfilPropio(id),
        ])
        setHabilidades(catalogo)
        setPerfil(perfilGuardado)
      } catch (e) {
        setErrorDeCarga(mensajeDeError(e))
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [id, intento])

  const guardar = async (persona) => {
    setEnviando(true)
    setError(null)
    try {
      await actualizarColaboradora(id, persona)
      await refrescarUsuario()
      // Recargamos para que los medios recién agregados tengan el id que les
      // dio el backend y lo conserven si se vuelve a guardar.
      setPerfil(await obtenerPerfilPropio(id))
      setGuardados(guardados + 1)
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setEnviando(false)
    }
  }

  const renderFormulario = () => {
    if (cargando) {
      return <Cargando texto="Cargando tu perfil..." />
    }

    if (errorDeCarga) {
      return (
        <MensajeDeError
          mensaje={errorDeCarga}
          alReintentar={() => setIntento(intento + 1)}
        />
      )
    }

    return (
      <FormularioColaboradora
        key={guardados}
        datosIniciales={perfil}
        habilidades={habilidades}
        textoBoton="Guardar cambios"
        enviando={enviando}
        error={error}
        exito={guardados > 0 && !error ? "Guardamos tus cambios" : null}
        alGuardar={guardar}
      />
    )
  }

  return (
    <section className="mi-perfil">
      <header className="mi-perfil-encabezado">
        <h1>Mi perfil</h1>
        <p>
          <Link to={`/colaboradoras/${id}`}>Ver mi perfil público</Link>
        </p>
      </header>
      {renderFormulario()}
    </section>
  )
}

export default MiPerfil
