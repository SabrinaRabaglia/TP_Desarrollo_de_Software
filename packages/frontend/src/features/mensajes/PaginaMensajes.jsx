import { useEffect, useState } from "react"
import { Alert, Button } from "@mui/material"
import { LuCheckCheck } from "react-icons/lu"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { useAuth } from "../../context/AuthContext"
import { useAvisos } from "../../context/AvisosContext"
import { useMensajesSinLeer } from "../../context/MensajesSinLeerContext"
import {
  marcarRecibidosComoLeidos,
  obtenerEnviados,
  obtenerRecibidos,
} from "../../service/mensajesService"
import { mensajeDeError } from "../../service/api"
import ListaDeMensajes from "./ListaDeMensajes"
import "./PaginaMensajes.css"

const cuantos = (cantidad) =>
  cantidad === 1 ? "1 mensaje" : `${cantidad} mensajes`

// Si el back no marcó ninguno es que ya estaban leídos (por ejemplo, desde
// otra pestaña).
const avisoDeLectura = (marcadas) => {
  if (marcadas === 0) {
    return "Tus mensajes ya estaban leídos."
  }
  return marcadas === 1
    ? "Marcaste 1 mensaje como leído."
    : `Marcaste ${marcadas} mensajes como leídos.`
}

// Los mensajes van en un solo sentido: el colectivo ve los que envió y la
// persona colaboradora, los que recibió. Solo la persona marca como leídos,
// y lo hace a mano, todos juntos: abrir la página no los marca.
const PaginaMensajes = () => {
  const { usuario } = useAuth()
  const { mostrarAviso } = useAvisos()
  const { actualizarSinLeer } = useMensajesSinLeer()
  const esColectivo = usuario.rol === "COLECTIVO"
  const entidadId = usuario.entidad?.id

  const [mensajes, setMensajes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)
  const [marcando, setMarcando] = useState(false)
  const [errorAlMarcar, setErrorAlMarcar] = useState(null)

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

  const sinLeer = mensajes.filter((mensaje) => mensaje.noLeido).length

  // El contador de la navbar sigue a la bandeja: al cargarla y al marcarla.
  useEffect(() => {
    if (!esColectivo && !cargando && !error) {
      actualizarSinLeer(sinLeer)
    }
  }, [esColectivo, cargando, error, sinLeer, actualizarSinLeer])

  const marcarComoLeidos = async () => {
    setMarcando(true)
    setErrorAlMarcar(null)
    try {
      const marcadas = await marcarRecibidosComoLeidos(entidadId)
      setMensajes((anteriores) =>
        anteriores.map((mensaje) => ({ ...mensaje, noLeido: false })),
      )
      mostrarAviso(avisoDeLectura(marcadas))
    } catch (e) {
      setErrorAlMarcar(mensajeDeError(e))
    } finally {
      setMarcando(false)
    }
  }

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
      <header className="pagina-mensajes-encabezado">
        <div className="pagina-mensajes-titulo">
          <h1>{esColectivo ? "Mensajes enviados" : "Mensajes recibidos"}</h1>
          {!esColectivo && mensajes.length > 0 && (
            <p className="pagina-mensajes-sin-leer">
              {sinLeer === 0
                ? "Leíste todos tus mensajes."
                : `Tenés ${cuantos(sinLeer)} sin leer.`}
            </p>
          )}
        </div>
        {!esColectivo && sinLeer > 0 && (
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<LuCheckCheck aria-hidden="true" />}
            onClick={marcarComoLeidos}
            disabled={marcando}
          >
            {marcando ? "Marcando..." : "Marcar todos como leídos"}
          </Button>
        )}
      </header>
      {errorAlMarcar && (
        <Alert severity="error" onClose={() => setErrorAlMarcar(null)}>
          {errorAlMarcar}
        </Alert>
      )}
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
