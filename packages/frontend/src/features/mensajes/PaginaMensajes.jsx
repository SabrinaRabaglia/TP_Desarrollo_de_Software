import { useEffect, useState } from "react"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { useAuth } from "../../context/AuthContext"
import {
  obtenerEnviados,
  obtenerRecibidos,
} from "../../service/mensajesService"
import { mensajeDeError } from "../../service/api"
import ListaDeMensajes from "./ListaDeMensajes"
import "./PaginaMensajes.css"

// Los mensajes van en un solo sentido: el colectivo ve los que envió y la
// persona colaboradora, los que recibió.
const PaginaMensajes = () => {
  const { usuario } = useAuth()
  const esColectivo = usuario.rol === "COLECTIVO"
  const entidadId = usuario.entidad?.id

  const [mensajes, setMensajes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        setMensajes(
          esColectivo
            ? await obtenerEnviados(entidadId)
            : await obtenerRecibidos(entidadId),
        )
      } catch (e) {
        setError(mensajeDeError(e))
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [esColectivo, entidadId, intento])

  if (cargando) {
    return <Cargando texto="Cargando los mensajes..." />
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
    <section className="pagina-mensajes">
      <h1>{esColectivo ? "Mensajes enviados" : "Mensajes recibidos"}</h1>
      <ListaDeMensajes
        mensajes={mensajes}
        textoVacio={
          esColectivo
            ? "Todavía no le escribiste a ninguna persona."
            : "Todavía no recibiste mensajes."
        }
      />
    </section>
  )
}

export default PaginaMensajes
