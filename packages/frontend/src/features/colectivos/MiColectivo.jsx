import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { useAuth } from "../../context/AuthContext"
import { mensajeDeError } from "../../service/api"
import {
  actualizarColectivo,
  obtenerCatalogosDeColectivo,
  obtenerColectivoPropio,
} from "../../service/colectivosService"
import FormularioColectivo from "./FormularioColectivo"
import "./MiColectivo.css"

const MiColectivo = () => {
  const { usuario, refrescarUsuario } = useAuth()
  const id = usuario.entidad.id

  const [catalogos, setCatalogos] = useState(null)
  const [colectivo, setColectivo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorDeCarga, setErrorDeCarga] = useState(null)
  const [intento, setIntento] = useState(0)

  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setErrorDeCarga(null)
      try {
        const [catalogosDisponibles, colectivoGuardado] = await Promise.all([
          obtenerCatalogosDeColectivo(),
          obtenerColectivoPropio(id),
        ])
        setCatalogos(catalogosDisponibles)
        setColectivo(colectivoGuardado)
      } catch (e) {
        setErrorDeCarga(mensajeDeError(e))
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [id, intento])

  const guardar = async (datos) => {
    setEnviando(true)
    setResultado(null)
    try {
      await actualizarColectivo(id, datos)
      await refrescarUsuario()
      setResultado({ exito: "Guardamos tus cambios" })
    } catch (e) {
      setResultado({ error: mensajeDeError(e) })
    } finally {
      setEnviando(false)
    }
  }

  const renderFormulario = () => {
    if (cargando) {
      return <Cargando texto="Cargando tu colectivo..." />
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
      <FormularioColectivo
        datosIniciales={colectivo}
        catalogos={catalogos}
        textoBoton="Guardar cambios"
        enviando={enviando}
        error={resultado?.error}
        exito={resultado?.exito}
        alGuardar={guardar}
      />
    )
  }

  return (
    <section className="mi-colectivo">
      <header className="mi-colectivo-encabezado">
        <h1>Mi colectivo</h1>
        <p>
          <Link to={`/colectivos/${id}`}>Ver la página pública</Link>
        </p>
      </header>
      {renderFormulario()}
    </section>
  )
}

export default MiColectivo
