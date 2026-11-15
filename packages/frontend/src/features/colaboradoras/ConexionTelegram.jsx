import { useEffect, useRef, useState } from "react"
import { Alert, Button } from "@mui/material"
import ConfirmarAccion from "../../components/confirmarAccion/ConfirmarAccion"
import { mensajeDeError } from "../../service/api"
import {
  crearEnlaceDeTelegram,
  eliminarMedioDeContacto,
  obtenerMediosDeContacto,
} from "../../service/colaboradorasService"
import "./ConexionTelegram.css"

const CADA_CUANTO_CONSULTAR_MS = 3000
const ESPERA_MAXIMA_MS = 2 * 60 * 1000

const SIN_CONECTAR = { fase: "sinConectar" }
const PIDIENDO_ENLACE = { fase: "pidiendoEnlace" }

const ConexionTelegram = ({ personaId, medio, alCambiar }) => {
  const [estado, setEstado] = useState(SIN_CONECTAR)
  const [aviso, setAviso] = useState(null)
  const [error, setError] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const [desconectando, setDesconectando] = useState(false)

  // El intervalo no debe reiniciarse cuando el padre pasa otra función.
  const alCambiarActual = useRef(alCambiar)
  useEffect(() => {
    alCambiarActual.current = alCambiar
  })

  useEffect(() => {
    if (estado.fase !== "pidiendoEnlace") {
      return
    }

    let cancelado = false
    const pedirEnlace = async () => {
      try {
        const { enlace } = await crearEnlaceDeTelegram(personaId)
        if (cancelado) {
          return
        }
        // Tras el await el navegador puede bloquear la ventana; por eso el
        // enlace visible queda siempre.
        window.open(enlace, "_blank", "noopener")
        setEstado({ fase: "esperando", enlace })
      } catch (e) {
        if (!cancelado) {
          setError(mensajeDeError(e))
          setEstado(SIN_CONECTAR)
        }
      }
    }

    pedirEnlace()
    return () => {
      cancelado = true
    }
  }, [estado, personaId])

  useEffect(() => {
    if (estado.fase !== "esperando") {
      return
    }

    let cancelado = false
    const consultar = async () => {
      try {
        const medios = await obtenerMediosDeContacto(personaId)
        const telegram = medios.find((m) => m.tipo === "TELEGRAM")
        if (telegram && !cancelado) {
          setEstado(SIN_CONECTAR)
          alCambiarActual.current(telegram)
        }
      } catch {
        // Un fallo suelto de red no corta la espera: se vuelve a consultar.
      }
    }

    const intervalo = setInterval(consultar, CADA_CUANTO_CONSULTAR_MS)
    const limite = setTimeout(() => {
      cancelado = true
      setAviso("No detectamos la conexión. Probá de nuevo.")
      setEstado(SIN_CONECTAR)
    }, ESPERA_MAXIMA_MS)

    return () => {
      cancelado = true
      clearInterval(intervalo)
      clearTimeout(limite)
    }
  }, [estado, personaId])

  const conectar = () => {
    setError(null)
    setAviso(null)
    setEstado(PIDIENDO_ENLACE)
  }

  const desconectar = async () => {
    setConfirmando(false)
    setDesconectando(true)
    setError(null)
    try {
      await eliminarMedioDeContacto(personaId, medio.id)
      alCambiar(null)
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setDesconectando(false)
    }
  }

  const renderContenido = () => {
    if (medio) {
      return (
        <>
          <p className="conexion-telegram-estado" role="status">
            Telegram conectado
          </p>
          <Button
            variant="outlined"
            color="error"
            size="small"
            disabled={desconectando}
            onClick={() => setConfirmando(true)}
          >
            {desconectando ? "Desconectando..." : "Desconectar"}
          </Button>
          <ConfirmarAccion
            abierto={confirmando}
            titulo="Desconectar Telegram"
            mensaje="Dejás de recibir avisos por Telegram. Podés volver a conectarlo cuando quieras."
            textoConfirmar="Desconectar"
            alConfirmar={desconectar}
            alCancelar={() => setConfirmando(false)}
          />
        </>
      )
    }

    if (estado.fase === "esperando") {
      return (
        <div role="status" className="conexion-telegram-espera">
          <p>
            Tocá Iniciar en el chat del bot. Cuando lo hagas, esta página se
            actualiza sola.
          </p>
          <div className="conexion-telegram-acciones">
            <a
              href={estado.enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="conexion-telegram-enlace"
            >
              Abrir Telegram
            </a>
            <Button onClick={() => setEstado(SIN_CONECTAR)}>Cancelar</Button>
          </div>
        </div>
      )
    }

    return (
      <Button
        variant="outlined"
        disabled={estado.fase === "pidiendoEnlace"}
        onClick={conectar}
      >
        {estado.fase === "pidiendoEnlace"
          ? "Conectando..."
          : "Conectar Telegram"}
      </Button>
    )
  }

  return (
    <div className="conexion-telegram" role="group" aria-label="Telegram">
      <p className="conexion-telegram-tipo">Telegram</p>
      <p className="conexion-telegram-ayuda">
        Te avisamos por Telegram cuando un colectivo te escribe. Por ahí no se
        responde: los mensajes se contestan desde la plataforma. Se conecta al
        instante, sin tocar Guardar cambios.
      </p>
      {aviso && (
        <Alert severity="info" role="status">
          {aviso}
        </Alert>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {renderContenido()}
    </div>
  )
}

export default ConexionTelegram
