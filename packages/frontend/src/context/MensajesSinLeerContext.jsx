import { createContext, useContext, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { useAuth } from "./AuthContext"
import { contarRecibidosSinLeer } from "../service/mensajesService"

const MensajesSinLeerContext = createContext(null)

// Cuántos mensajes tiene sin leer la persona colaboradora, para el contador de
// la navbar. Se vuelve a pedir al cambiar de página, así aparecen los que
// llegaron mientras navegaba. La página de mensajes lo corrige al cargar y al
// marcarlos como leídos, sin esperar a que se cambie de página.
export const ProveedorDeMensajesSinLeer = ({ children }) => {
  const { usuario } = useAuth()
  const { pathname } = useLocation()
  const [sinLeer, setSinLeer] = useState(0)

  const personaId =
    usuario?.rol === "PERSONA_COLABORADORA" ? usuario.entidad?.id : null

  useEffect(() => {
    if (!personaId) {
      setSinLeer(0)
      return
    }

    let vigente = true
    contarRecibidosSinLeer(personaId)
      .then((cantidad) => {
        if (vigente) {
          setSinLeer(cantidad)
        }
      })
      // Si falla, el contador queda como estaba: no vale la pena cortar la
      // página por esto, y se vuelve a intentar en la próxima.
      .catch(() => {})

    return () => {
      vigente = false
    }
  }, [personaId, pathname])

  return (
    <MensajesSinLeerContext.Provider
      value={{ sinLeer, actualizarSinLeer: setSinLeer }}
    >
      {children}
    </MensajesSinLeerContext.Provider>
  )
}

export const useMensajesSinLeer = () => useContext(MensajesSinLeerContext)
